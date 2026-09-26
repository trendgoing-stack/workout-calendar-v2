import type { AppData, Exercise, RecordType, SessionExercise, SetEntry } from '../types'
import type { V1AppData, V1Exercise, V1Set } from '../types/v1'
import { MASTER_EXERCISES } from '../data/exercises'
import { buildNameIndex, createCustomExerciseId } from './exerciseCatalog'
import { createId } from './id'
import { normalizeText } from './textNormalize'

/**
 * 旧形式（v1）→ v2 の移行。純粋関数で、localStorage には触れない
 * （書き込みは呼び出し側が、移行が最後まで成功してから行う）。
 *
 * 規則：
 * - 種目名を正規化し、マスタの name / aliases と完全一致したら、その種目に紐付ける
 * - 一致しない名前は、正規化後の名前ごとに1件のカスタム種目として登録する
 *   - 記録タイプ：その名前の全セットに重量（0 より大）があれば weightReps、それ以外は reps
 *   - 部位：その名前にいちばん多く付いていた部位タグ
 * - 数値は捨てない。reps タイプに重量が入っていたら weighted: true として重量を保持する
 * - time タイプ（プランク）に紐付いた場合、v1 には秒数の欄が無かったので、回数の値を秒数に移す
 */

export interface MigrationReport {
  /** マスタに紐付けた種目名（元の表記 → マスタ種目名） */
  linked: Array<{ from: string; to: string }>
  /** カスタム種目として登録した種目名 */
  created: string[]
}

export interface MigrationResult {
  data: AppData
  report: MigrationReport
}

/** 旧データで「部位タグが無い」カスタム種目に付ける部位（設定画面で直してもらう） */
export const UNKNOWN_BODY_PART = '__unknown__'

const hasWeight = (set: V1Set) => set.weight !== null && set.weight > 0
const positive = (v: number | null): number | undefined => (v !== null && v > 0 ? v : undefined)

function mostFrequent(ids: string[]): string | undefined {
  const counts = new Map<string, number>()
  for (const id of ids) counts.set(id, (counts.get(id) ?? 0) + 1)
  let best: string | undefined
  let bestCount = 0
  for (const [id, count] of counts) {
    if (count > bestCount) {
      best = id
      bestCount = count
    }
  }
  return best
}

function convertSets(
  sets: V1Set[],
  recordType: RecordType,
): { sets: SetEntry[]; weighted: boolean; droppedWeights: number[] } {
  const weighted = recordType === 'reps' && sets.some(hasWeight)
  const droppedWeights: number[] = []
  const converted = sets.map((set): SetEntry => {
    const next: SetEntry = { id: createId() }
    const reps = positive(set.reps)
    const weight = positive(set.weight)
    if (recordType === 'time') {
      if (reps !== undefined) next.seconds = reps
      if (weight !== undefined) droppedWeights.push(weight)
      return next
    }
    if (reps !== undefined) next.reps = reps
    if (weight !== undefined) next.weight = weight
    return next
  })
  return { sets: converted, weighted, droppedWeights }
}

export function migrateV1ToV2(v1: V1AppData): MigrationResult {
  const masterIndex = buildNameIndex(MASTER_EXERCISES)

  // 1. 全種目名（記録とルーティン）を集め、マスタとの対応を決める
  const allEntries: V1Exercise[] = [
    ...v1.sessions.flatMap((s) => s.exercises),
    ...v1.routines.flatMap((r) => r.exercises),
  ]
  const unmatched = new Map<string, V1Exercise[]>()
  const linkedNames = new Map<string, { from: string; to: string }>()
  for (const entry of allEntries) {
    const key = normalizeText(entry.name)
    const master = masterIndex.get(key)
    if (master) {
      if (!linkedNames.has(key)) linkedNames.set(key, { from: entry.name, to: master.name })
    } else {
      const list = unmatched.get(key)
      if (list) list.push(entry)
      else unmatched.set(key, [entry])
    }
  }

  // 2. 一致しない名前をカスタム種目として登録する
  const customByKey = new Map<string, Exercise>()
  let order = 0
  for (const [key, entries] of unmatched) {
    const sets = entries.flatMap((e) => e.sets)
    const recordType: RecordType =
      sets.length > 0 && sets.every(hasWeight) ? 'weightReps' : 'reps'
    customByKey.set(key, {
      id: createCustomExerciseId(),
      name: entries[0].name,
      kana: '',
      aliases: [],
      bodyPart: mostFrequent(entries.flatMap((e) => e.muscleGroupIds)) ?? UNKNOWN_BODY_PART,
      recordType,
      allowOptionalWeight: recordType === 'reps' && sets.some(hasWeight),
      unilateral: false,
      hint: '',
      order: order++,
      builtIn: false,
    })
  }

  // 3. 記録とルーティンの種目を変換する
  const convertEntry = (entry: V1Exercise): SessionExercise => {
    const key = normalizeText(entry.name)
    const exercise = masterIndex.get(key) ?? customByKey.get(key)
    if (!exercise) throw new Error(`種目「${entry.name}」を変換できませんでした`)
    const { sets, weighted, droppedWeights } = convertSets(entry.sets, exercise.recordType)
    const memoParts = [entry.memo.trim()]
    if (droppedWeights.length > 0) {
      memoParts.push(`（旧データの重量: ${droppedWeights.join(' / ')}）`)
    }
    const memo = memoParts.filter(Boolean).join(' ')
    const bodyPartTag = exercise.bodyPart === UNKNOWN_BODY_PART ? [] : [exercise.bodyPart]
    return {
      id: createId(),
      exerciseId: exercise.id,
      nameSnapshot: exercise.builtIn ? exercise.name : entry.name,
      recordTypeSnapshot: exercise.recordType,
      muscleGroupIds: entry.muscleGroupIds.length > 0 ? [...entry.muscleGroupIds] : bodyPartTag,
      ...(weighted ? { weighted: true } : {}),
      sets,
      ...(memo ? { memo } : {}),
    }
  }

  const data: AppData = {
    schemaVersion: 2,
    sessions: v1.sessions.map((session) => ({
      ...session,
      exercises: session.exercises.map(convertEntry),
    })),
    routines: v1.routines.map((routine) => ({
      ...routine,
      exercises: routine.exercises.map(convertEntry),
    })),
    customExercises: [...customByKey.values()],
    settings: v1.settings,
  }

  return {
    data,
    report: {
      linked: [...linkedNames.values()],
      created: [...customByKey.values()].map((e) => e.name),
    },
  }
}
