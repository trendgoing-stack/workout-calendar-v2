import type { Exercise, SessionExercise } from '../types'
import { MASTER_EXERCISES } from '../data/exercises'
import { normalizeText } from './textNormalize'

/** マスタ種目とカスタム種目をまとめた一覧（アーカイブ済みのカスタム種目も含む） */
export function buildCatalog(customExercises: Exercise[]): Exercise[] {
  return [...MASTER_EXERCISES, ...customExercises]
}

export function exerciseMap(list: Exercise[]): Map<string, Exercise> {
  return new Map(list.map((e) => [e.id, e]))
}

/**
 * 記録の種目を種目定義に解決する。
 * 種目が見つからない（インポートしたデータの参照切れなど）場合は、記録時点のスナップショットから作る。
 */
export function resolveExercise(
  map: Map<string, Exercise>,
  entry: Pick<SessionExercise, 'exerciseId' | 'nameSnapshot' | 'recordTypeSnapshot' | 'muscleGroupIds'>,
): Exercise {
  return (
    map.get(entry.exerciseId) ?? {
      id: entry.exerciseId,
      name: entry.nameSnapshot,
      kana: '',
      aliases: [],
      bodyPart: entry.muscleGroupIds[0] ?? '',
      recordType: entry.recordTypeSnapshot,
      allowOptionalWeight: entry.recordTypeSnapshot === 'reps',
      unilateral: false,
      hint: '',
      order: 999,
      builtIn: false,
      archived: true,
    }
  )
}

/** 記録の種目の表示名。非表示にしたカスタム種目は記録時点の名前で表示し続ける */
export function entryDisplayName(
  map: Map<string, Exercise>,
  entry: Pick<SessionExercise, 'exerciseId' | 'nameSnapshot' | 'recordTypeSnapshot' | 'muscleGroupIds'>,
): string {
  const exercise = resolveExercise(map, entry)
  return exercise.archived ? entry.nameSnapshot : exercise.name
}

/** 名前・読み・別名を正規化したもの（検索用） */
function searchKeys(exercise: Exercise): string[] {
  return [exercise.name, exercise.kana, ...exercise.aliases].map(normalizeText).filter(Boolean)
}

/** 名前・読み・別名の部分一致で絞り込む */
export function searchExercises(list: Exercise[], query: string): Exercise[] {
  const q = normalizeText(query)
  if (!q) return list
  return list.filter((exercise) => searchKeys(exercise).some((key) => key.includes(q)))
}

/** 正規化した名前・別名 → 種目 の索引（完全一致の照合用） */
export function buildNameIndex(list: Exercise[]): Map<string, Exercise> {
  const index = new Map<string, Exercise>()
  for (const exercise of list) {
    for (const name of [exercise.name, ...exercise.aliases]) {
      const key = normalizeText(name)
      if (key && !index.has(key)) index.set(key, exercise)
    }
  }
  return index
}

/** 同じ名前（正規化後）の種目がすでにあるか。編集中の種目自身は除く */
export function isNameTaken(list: Exercise[], name: string, excludeId?: string): boolean {
  const key = normalizeText(name)
  return list.some(
    (exercise) =>
      exercise.id !== excludeId &&
      !exercise.archived &&
      normalizeText(exercise.name) === key,
  )
}

export function createCustomExerciseId(): string {
  const random =
    typeof crypto !== 'undefined' && 'getRandomValues' in crypto
      ? Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) =>
          b.toString(36).padStart(2, '0'),
        ).join('')
      : Math.random().toString(36).slice(2, 14)
  return `custom-${random}`
}

/** 画像の URL（公開パスからの相対パスを、ページからの相対 URL にする） */
export function exerciseImageUrl(exercise: Exercise, baseUrl: string): string | null {
  return exercise.image ? `${baseUrl}${exercise.image}` : null
}
