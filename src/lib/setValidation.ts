import type { RecordType, SessionExercise, SetEntry, WeightUnit } from '../types'

/** セットの入力欄 */
export type SetField = 'weight' | 'reps' | 'seconds'

/** 記録タイプごとに入力が必要な欄 */
export function requiredFields(recordType: RecordType, weighted: boolean | undefined): SetField[] {
  switch (recordType) {
    case 'weightReps':
      return ['weight', 'reps']
    case 'reps':
      return weighted ? ['reps', 'weight'] : ['reps']
    case 'time':
      return ['seconds']
  }
}

export const WEIGHT_RANGE: Record<WeightUnit, { min: number; max: number }> = {
  kg: { min: 0.5, max: 300 },
  lb: { min: 1, max: 660 },
}

/** 1つの欄の値が有効か（空欄は無効） */
export function isFieldValid(field: SetField, value: number | undefined, unit: WeightUnit): boolean {
  if (value === undefined || !Number.isFinite(value)) return false
  switch (field) {
    case 'reps':
      return Number.isInteger(value) && value >= 1 && value <= 999
    case 'seconds':
      return Number.isInteger(value) && value >= 1 && value <= 3600
    case 'weight': {
      const { min, max } = WEIGHT_RANGE[unit]
      return value >= min && value <= max && Number.isInteger(value * 2)
    }
  }
}

/** 種目内の不正な欄を「セット ID → 欄の一覧」で返す。空なら保存できる */
export function invalidFieldsOf(
  exercise: Pick<SessionExercise, 'recordTypeSnapshot' | 'weighted' | 'sets'>,
  unit: WeightUnit,
): Map<string, SetField[]> {
  const fields = requiredFields(exercise.recordTypeSnapshot, exercise.weighted)
  const result = new Map<string, SetField[]>()
  for (const set of exercise.sets) {
    const bad = fields.filter((field) => !isFieldValid(field, set[field], unit))
    if (bad.length > 0) result.set(set.id, bad)
  }
  return result
}

/** 記録タイプで使わない値を取り除く（加重トグルを OFF にした重量など） */
export function stripUnusedFields(
  set: SetEntry,
  recordType: RecordType,
  weighted: boolean | undefined,
): SetEntry {
  const fields = requiredFields(recordType, weighted)
  const next: SetEntry = { id: set.id }
  for (const field of fields) {
    if (set[field] !== undefined) next[field] = set[field]
  }
  return next
}
