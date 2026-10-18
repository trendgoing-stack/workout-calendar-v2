import type { RecordType, SetEntry, WeightUnit } from '../types'

/** 秒数を表示用に整形する。60秒以上は m:ss（例: 90 → '1:30'） */
export function formatSeconds(seconds: number): string {
  if (seconds < 60) return `${seconds}秒`
  const m = Math.floor(seconds / 60)
  const s = `${seconds % 60}`.padStart(2, '0')
  return `${m}:${s}`
}

/** 1セットを「60kg × 10」「12回」「1:30」のように整形する */
export function formatSet(
  set: SetEntry,
  recordType: RecordType,
  unit: WeightUnit,
  unilateral = false,
): string {
  if (recordType === 'time') {
    return set.seconds === undefined ? '-' : formatSeconds(set.seconds)
  }
  const reps = set.reps === undefined ? '' : `${set.reps}回${unilateral ? '(片側)' : ''}`
  const weight = set.weight === undefined ? '' : `${set.weight}${unit}`
  if (weight && reps) return `${weight} × ${reps}`
  return weight || reps || '-'
}

/**
 * 1種目ぶんの合計（入力中の画面に出す）。例：「合計 30回 ・ ボリューム 375kg」「合計 3:45」
 * 未入力の欄は数えない。合計が 0 なら null。
 */
export function formatExerciseTotal(
  sets: SetEntry[],
  recordType: RecordType,
  weighted: boolean | undefined,
  unit: WeightUnit,
  unilateral = false,
): string | null {
  const positive = (v: number | undefined) => (v !== undefined && Number.isFinite(v) && v > 0 ? v : 0)
  if (recordType === 'time') {
    const seconds = sets.reduce((sum, s) => sum + positive(s.seconds), 0)
    return seconds > 0 ? `合計 ${formatSeconds(seconds)}` : null
  }
  const reps = sets.reduce((sum, s) => sum + positive(s.reps), 0)
  if (reps === 0) return null
  const parts = [`合計 ${reps}回${unilateral ? '（片側）' : ''}`]
  if (recordType === 'weightReps' || weighted) {
    const volume = sets.reduce((sum, s) => sum + positive(s.weight) * positive(s.reps), 0)
    if (volume > 0) parts.push(`ボリューム ${(Math.round(volume * 10) / 10).toLocaleString()}${unit}`)
  }
  return parts.join(' ・ ')
}

/** 記録タイプのバッジ表示 */
export function recordTypeBadge(recordType: RecordType): string {
  switch (recordType) {
    case 'weightReps':
      return 'ダンベル'
    case 'reps':
      return '自重'
    case 'time':
      return '秒'
  }
}

export const RECORD_TYPE_LABELS: Record<RecordType, string> = {
  weightReps: '重量 × 回数',
  reps: '回数のみ',
  time: '秒数のみ',
}
