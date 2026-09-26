import type {
  AppData,
  Exercise,
  MuscleGroup,
  RecordType,
  Routine,
  SessionExercise,
  SetEntry,
  Settings,
  WorkoutSession,
} from '../types'
import type { V1AppData, V1Exercise, V1Routine, V1Session, V1Set } from '../types/v1'
import { MASTER_EXERCISES } from '../data/exercises'
import { DEFAULT_MUSCLE_GROUPS, DEFAULT_SETTINGS } from './constants'
import { isValidISODate, todayISO } from './date'
import { createId, nowIso } from './id'

/**
 * 外部（localStorage / インポートした JSON）から来たデータを検証・補完する。
 * 壊れた値は捨てて既定値に寄せることで、アプリが起動不能にならないようにする。
 * - normalizeAppData: v2 形式
 * - normalizeV1AppData: 旧形式（v1）。移行処理の入口で使う
 */

export const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

const str = (v: unknown, fallback = ''): string => (typeof v === 'string' ? v : fallback)

const numOrNull = (v: unknown): number | null => {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

const numOrUndef = (v: unknown): number | undefined => numOrNull(v) ?? undefined

const strArray = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []

const isHexColor = (v: unknown): v is string =>
  typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v)

const RECORD_TYPES: RecordType[] = ['weightReps', 'reps', 'time']
const isRecordType = (v: unknown): v is RecordType => RECORD_TYPES.includes(v as RecordType)

const byDateDesc = (a: { date: string }, b: { date: string }) =>
  a.date < b.date ? 1 : a.date > b.date ? -1 : 0

/* ---------- 共通 ---------- */

function normalizeMuscleGroups(input: unknown): MuscleGroup[] {
  if (!Array.isArray(input)) return DEFAULT_MUSCLE_GROUPS
  const groups = input.filter(isObject).map((g, i) => ({
    id: str(g.id) || createId(),
    name: str(g.name) || `部位${i + 1}`,
    color: isHexColor(g.color) ? g.color : '#64748b',
    order: typeof g.order === 'number' ? g.order : i,
  }))
  return groups.length > 0
    ? groups.sort((a, b) => a.order - b.order).map((g, i) => ({ ...g, order: i }))
    : DEFAULT_MUSCLE_GROUPS
}

function normalizeSettings(input: unknown): Settings {
  if (!isObject(input)) return DEFAULT_SETTINGS
  return {
    muscleGroups: normalizeMuscleGroups(input.muscleGroups),
    weightUnit: input.weightUnit === 'lb' ? 'lb' : 'kg',
    weekStartsOn: input.weekStartsOn === 0 ? 0 : 1,
  }
}

/** インポートしたファイルがこのアプリのデータとして読めるかざっくり判定する */
export function looksLikeAppData(input: unknown): boolean {
  return (
    isObject(input) &&
    (Array.isArray(input.sessions) ||
      Array.isArray(input.routines) ||
      isObject(input.settings))
  )
}

/** v2 形式のデータか（schemaVersion が無い、または 2 以外なら v1 として扱う） */
export function isV2Data(input: unknown): boolean {
  return isObject(input) && input.schemaVersion === 2
}

/* ---------- v2 ---------- */

function normalizeSet(input: Record<string, unknown>): SetEntry {
  const set: SetEntry = { id: str(input.id) || createId() }
  const reps = numOrUndef(input.reps)
  const weight = numOrUndef(input.weight)
  const seconds = numOrUndef(input.seconds)
  if (reps !== undefined) set.reps = reps
  if (weight !== undefined) set.weight = weight
  if (seconds !== undefined) set.seconds = seconds
  return set
}

function normalizeSessionExercise(input: unknown): SessionExercise | null {
  if (!isObject(input)) return null
  const exerciseId = str(input.exerciseId)
  if (!exerciseId) return null
  const entry: SessionExercise = {
    id: str(input.id) || createId(),
    exerciseId,
    nameSnapshot: str(input.nameSnapshot) || exerciseId,
    recordTypeSnapshot: isRecordType(input.recordTypeSnapshot)
      ? input.recordTypeSnapshot
      : 'weightReps',
    muscleGroupIds: strArray(input.muscleGroupIds),
    sets: Array.isArray(input.sets) ? input.sets.filter(isObject).map(normalizeSet) : [],
  }
  if (input.weighted === true) entry.weighted = true
  const memo = str(input.memo)
  if (memo) entry.memo = memo
  return entry
}

const isEntry = (e: SessionExercise | null): e is SessionExercise => e !== null

function normalizeSession(input: unknown): WorkoutSession | null {
  if (!isObject(input) || !isValidISODate(input.date)) return null
  const createdAt = str(input.createdAt) || nowIso()
  return {
    id: str(input.id) || createId(),
    date: input.date,
    exercises: Array.isArray(input.exercises)
      ? input.exercises.map(normalizeSessionExercise).filter(isEntry)
      : [],
    memo: str(input.memo),
    createdAt,
    updatedAt: str(input.updatedAt) || createdAt,
  }
}

function normalizeRoutine(input: unknown): Routine | null {
  if (!isObject(input)) return null
  const name = str(input.name).trim()
  if (!name) return null
  const createdAt = str(input.createdAt) || nowIso()
  return {
    id: str(input.id) || createId(),
    name,
    description: str(input.description),
    exercises: Array.isArray(input.exercises)
      ? input.exercises.map(normalizeSessionExercise).filter(isEntry)
      : [],
    createdAt,
    updatedAt: str(input.updatedAt) || createdAt,
  }
}

function normalizeCustomExercise(input: unknown, index: number): Exercise | null {
  if (!isObject(input)) return null
  const id = str(input.id)
  const name = str(input.name).trim()
  if (!id.startsWith('custom-') || !name) return null
  const exercise: Exercise = {
    id,
    name,
    kana: str(input.kana),
    aliases: strArray(input.aliases),
    bodyPart: str(input.bodyPart),
    recordType: isRecordType(input.recordType) ? input.recordType : 'weightReps',
    allowOptionalWeight: input.allowOptionalWeight === true,
    unilateral: input.unilateral === true,
    hint: str(input.hint).slice(0, 60),
    order: typeof input.order === 'number' ? input.order : index,
    builtIn: false,
  }
  const image = str(input.image)
  if (image) exercise.image = image
  if (input.archived === true) exercise.archived = true
  return exercise
}

export function createEmptyAppData(): AppData {
  return {
    schemaVersion: 2,
    sessions: [],
    routines: [],
    customExercises: [],
    settings: DEFAULT_SETTINGS,
  }
}

/** 任意の入力値を安全な v2 の AppData に変換する（v2 形式の入力が前提） */
export function normalizeAppData(input: unknown): AppData {
  if (!isObject(input)) return createEmptyAppData()
  return {
    schemaVersion: 2,
    sessions: Array.isArray(input.sessions)
      ? input.sessions
          .map(normalizeSession)
          .filter((s): s is WorkoutSession => s !== null)
          .sort(byDateDesc)
      : [],
    routines: Array.isArray(input.routines)
      ? input.routines.map(normalizeRoutine).filter((r): r is Routine => r !== null)
      : [],
    customExercises: Array.isArray(input.customExercises)
      ? input.customExercises
          .map(normalizeCustomExercise)
          .filter((e): e is Exercise => e !== null)
      : [],
    settings: normalizeSettings(input.settings),
  }
}

/* ---------- v1（旧形式） ---------- */

function normalizeV1Sets(input: unknown): V1Set[] {
  if (!Array.isArray(input)) return []
  return input
    .filter(isObject)
    .map((s) => ({ weight: numOrNull(s.weight), reps: numOrNull(s.reps) }))
}

function normalizeV1Exercise(input: unknown): V1Exercise | null {
  if (!isObject(input)) return null
  const name = str(input.name).trim()
  if (!name) return null
  return {
    name,
    muscleGroupIds: strArray(input.muscleGroupIds),
    sets: normalizeV1Sets(input.sets),
    memo: str(input.memo),
  }
}

const isV1Exercise = (e: V1Exercise | null): e is V1Exercise => e !== null

function normalizeV1Session(input: unknown): V1Session | null {
  if (!isObject(input) || !isValidISODate(input.date)) return null
  const createdAt = str(input.createdAt) || nowIso()
  return {
    id: str(input.id) || createId(),
    date: input.date,
    exercises: Array.isArray(input.exercises)
      ? input.exercises.map(normalizeV1Exercise).filter(isV1Exercise)
      : [],
    memo: str(input.memo),
    createdAt,
    updatedAt: str(input.updatedAt) || createdAt,
  }
}

function normalizeV1Routine(input: unknown): V1Routine | null {
  if (!isObject(input)) return null
  const name = str(input.name).trim()
  if (!name) return null
  const createdAt = str(input.createdAt) || nowIso()
  return {
    id: str(input.id) || createId(),
    name,
    description: str(input.description),
    exercises: Array.isArray(input.exercises)
      ? input.exercises.map(normalizeV1Exercise).filter(isV1Exercise)
      : [],
    createdAt,
    updatedAt: str(input.updatedAt) || createdAt,
  }
}

/** 旧形式（v1）のデータを検証・補完する */
export function normalizeV1AppData(input: Record<string, unknown>): V1AppData {
  return {
    sessions: Array.isArray(input.sessions)
      ? input.sessions
          .map(normalizeV1Session)
          .filter((s): s is V1Session => s !== null)
          .sort(byDateDesc)
      : [],
    routines: Array.isArray(input.routines)
      ? input.routines.map(normalizeV1Routine).filter((r): r is V1Routine => r !== null)
      : [],
    settings: normalizeSettings(input.settings),
  }
}

/* ---------- サンプルデータ ---------- */

/** デモ用のサンプルデータ（設定画面から投入できる） */
export function createSampleData(): Pick<AppData, 'sessions' | 'routines'> {
  const [y, m, d] = todayISO().split('-').map(Number)
  const dateBefore = (n: number) => {
    const dt = new Date(y, m - 1, d - n)
    const mm = `${dt.getMonth() + 1}`.padStart(2, '0')
    const dd = `${dt.getDate()}`.padStart(2, '0')
    return `${dt.getFullYear()}-${mm}-${dd}`
  }
  const master = new Map(MASTER_EXERCISES.map((e) => [e.id, e]))

  /** [種目 id, セット（weightReps: [重量, 回数] / reps: [回数] or [回数, 重量] / time: [秒]）] */
  type Row = [string, number[][]]
  const entry = ([exerciseId, sets]: Row): SessionExercise => {
    const exercise = master.get(exerciseId)!
    const weighted = exercise.recordType === 'reps' && sets.some((s) => s.length > 1)
    return {
      id: createId(),
      exerciseId,
      nameSnapshot: exercise.name,
      recordTypeSnapshot: exercise.recordType,
      muscleGroupIds: [exercise.bodyPart],
      ...(weighted ? { weighted: true } : {}),
      sets: sets.map((s) => {
        if (exercise.recordType === 'weightReps') return { id: createId(), weight: s[0], reps: s[1] }
        if (exercise.recordType === 'time') return { id: createId(), seconds: s[0] }
        return weighted
          ? { id: createId(), reps: s[0], weight: s[1] }
          : { id: createId(), reps: s[0] }
      }),
    }
  }
  const session = (dateOffset: number, rows: Row[]): WorkoutSession => ({
    id: createId(),
    date: dateBefore(dateOffset),
    exercises: rows.map(entry),
    memo: '',
    createdAt: nowIso(),
    updatedAt: nowIso(),
  })

  return {
    sessions: [
      session(0, [
        ['push-up', [[20], [18], [15]]],
        ['dumbbell-floor-press', [[12, 12], [14, 10], [14, 9]]],
      ]),
      session(2, [
        ['one-arm-dumbbell-row', [[14, 12], [16, 10], [16, 10]]],
        ['back-extension', [[20], [18]]],
      ]),
      session(4, [
        ['ab-roller-knee', [[12], [10]]],
        ['plank', [[60], [75], [90]]],
      ]),
      session(5, [
        ['bulgarian-split-squat', [[12, 4], [10, 6]]],
        ['calf-raise', [[25], [25]]],
      ]),
      session(7, [
        ['push-up', [[18], [16], [15]]],
        ['side-raise', [[6, 15], [6, 12]]],
      ]),
      session(9, [
        ['dumbbell-curl', [[10, 12], [10, 10]]],
        ['bench-dips', [[15], [12]]],
      ]),
      session(12, [
        ['plank', [[45], [60]]],
        ['crunch', [[20], [20]]],
      ]),
    ],
    routines: [
      {
        id: createId(),
        name: '胸の日',
        description: '自宅でのプッシュ系',
        exercises: [
          entry(['push-up', [[20], [20], [20]]]),
          entry(['dumbbell-floor-press', [[14, 10], [14, 10], [14, 10]]]),
          entry(['narrow-push-up', [[12], [12]]]),
        ],
        createdAt: nowIso(),
        updatedAt: nowIso(),
      },
    ],
  }
}
