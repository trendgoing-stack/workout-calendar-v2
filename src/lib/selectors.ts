import type { ISODate, MuscleGroup, SetEntry, WeekStart, WorkoutSession } from '../types'
import {
  addDays,
  addMonths,
  parseISODate,
  startOfWeek,
  toISODate,
  todayISO,
} from './date'

/** 表示用の集計はすべてここ（純粋関数）にまとめる */

/** セッションに含まれる部位タグ（種目の部位の和集合、表示順を維持） */
export function sessionMuscleGroupIds(session: WorkoutSession): string[] {
  const seen = new Set<string>()
  for (const exercise of session.exercises) {
    for (const id of exercise.muscleGroupIds) seen.add(id)
  }
  return [...seen]
}

/** 日付をキーにしたセッションの索引 */
export function groupSessionsByDate(
  sessions: WorkoutSession[],
): Map<ISODate, WorkoutSession[]> {
  const map = new Map<ISODate, WorkoutSession[]>()
  for (const session of sessions) {
    const list = map.get(session.date)
    if (list) list.push(session)
    else map.set(session.date, [session])
  }
  return map
}

/** 1セッションの総ボリューム（重量 × 回数の合計） */
export function sessionVolume(session: WorkoutSession): number {
  return session.exercises.reduce(
    (total, exercise) =>
      total +
      exercise.sets.reduce((sum, set) => sum + (set.weight ?? 0) * (set.reps ?? 0), 0),
    0,
  )
}

export function sessionSetCount(session: WorkoutSession): number {
  return session.exercises.reduce((total, e) => total + e.sets.length, 0)
}

/** 前回の記録（初期値の入力に使う） */
export interface LastRecord {
  /** 最終セット */
  lastSet?: SetEntry
  weighted: boolean
}

/**
 * その種目の前回記録（いちばん新しい日の、その種目の最後のブロック）。
 * 編集中のセッション自身は除く。sessions は新しい順に並んでいる前提。
 */
export function lastRecordOf(
  sessions: WorkoutSession[],
  exerciseId: string,
  excludeSessionId?: string,
): LastRecord | undefined {
  for (const session of sessions) {
    if (session.id === excludeSessionId) continue
    const found = session.exercises.filter((e) => e.exerciseId === exerciseId).at(-1)
    if (found) return { lastSet: found.sets.at(-1), weighted: found.weighted === true }
  }
  return undefined
}

/** 直近に記録した種目 ID（新しい順・重複なし） */
export function recentExerciseIds(sessions: WorkoutSession[], limit = 10): string[] {
  const ids: string[] = []
  for (const session of sessions) {
    for (const exercise of session.exercises) {
      if (!ids.includes(exercise.exerciseId)) ids.push(exercise.exerciseId)
      if (ids.length >= limit) return ids
    }
  }
  return ids
}

/** 記録のある種目 ID（よく行う順） */
export function usedExerciseIds(sessions: WorkoutSession[]): string[] {
  const counts = new Map<string, number>()
  for (const session of sessions) {
    for (const exercise of session.exercises) {
      counts.set(exercise.exerciseId, (counts.get(exercise.exerciseId) ?? 0) + 1)
    }
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id)
}

export interface PeriodBucket {
  key: string
  label: string
  start: ISODate
  end: ISODate
}

/** 直近 n 週 / n ヶ月分のバケットを古い順に作る */
export function buildBuckets(
  unit: 'week' | 'month',
  count: number,
  weekStartsOn: WeekStart,
): PeriodBucket[] {
  const buckets: PeriodBucket[] = []
  const today = parseISODate(todayISO())

  if (unit === 'week') {
    const thisWeekStart = startOfWeek(today, weekStartsOn)
    for (let i = count - 1; i >= 0; i--) {
      const start = addDays(thisWeekStart, -7 * i)
      const end = addDays(start, 6)
      buckets.push({
        key: toISODate(start),
        label: `${start.getMonth() + 1}/${start.getDate()}`,
        start: toISODate(start),
        end: toISODate(end),
      })
    }
    return buckets
  }

  const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1)
  for (let i = count - 1; i >= 0; i--) {
    const start = addMonths(thisMonthStart, -i)
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 0)
    buckets.push({
      key: toISODate(start).slice(0, 7),
      label: `${start.getMonth() + 1}月`,
      start: toISODate(start),
      end: toISODate(end),
    })
  }
  return buckets
}

export interface FrequencyRow {
  bucket: PeriodBucket
  /** 部位 ID -> その期間にその部位を鍛えた日数 */
  countsByGroup: Record<string, number>
  /** その期間のトレーニング日数 */
  totalDays: number
}

/**
 * 期間ごと・部位ごとのトレーニング頻度（＝その部位を鍛えた「日数」）を集計する
 */
export function frequencyByPeriod(
  sessions: WorkoutSession[],
  buckets: PeriodBucket[],
): FrequencyRow[] {
  return buckets.map((bucket) => {
    const inRange = sessions.filter(
      (s) => s.date >= bucket.start && s.date <= bucket.end,
    )
    const countsByGroup: Record<string, number> = {}
    const daysByGroup = new Map<string, Set<ISODate>>()
    const days = new Set<ISODate>()

    for (const session of inRange) {
      days.add(session.date)
      for (const groupId of sessionMuscleGroupIds(session)) {
        const set = daysByGroup.get(groupId) ?? new Set<ISODate>()
        set.add(session.date)
        daysByGroup.set(groupId, set)
      }
    }
    for (const [groupId, dates] of daysByGroup) {
      countsByGroup[groupId] = dates.size
    }
    return { bucket, countsByGroup, totalDays: days.size }
  })
}

export interface ExerciseProgressPoint {
  date: ISODate
  /** その日の最大重量（重量の無い日は 0） */
  maxWeight: number
  /** その日の総ボリューム（重量 × 回数） */
  volume: number
  /** 推定1RM（Epley 式）。重量が無い種目では 0 */
  estimated1RM: number
  /** 1セットの最大回数 */
  maxReps: number
  /** 最長秒数 */
  maxSeconds: number
  setCount: number
}

/** ある種目の推移（日付の古い順） */
export function exerciseProgress(
  sessions: WorkoutSession[],
  exerciseId: string,
): ExerciseProgressPoint[] {
  const byDate = new Map<ISODate, ExerciseProgressPoint>()

  for (const session of sessions) {
    for (const exercise of session.exercises) {
      if (exercise.exerciseId !== exerciseId) continue
      const point =
        byDate.get(session.date) ??
        {
          date: session.date,
          maxWeight: 0,
          volume: 0,
          estimated1RM: 0,
          maxReps: 0,
          maxSeconds: 0,
          setCount: 0,
        }
      for (const set of exercise.sets) {
        const weight = set.weight ?? 0
        const reps = set.reps ?? 0
        point.maxWeight = Math.max(point.maxWeight, weight)
        point.maxReps = Math.max(point.maxReps, reps)
        point.maxSeconds = Math.max(point.maxSeconds, set.seconds ?? 0)
        point.volume += weight * reps
        point.setCount += 1
        if (weight > 0 && reps > 0) {
          point.estimated1RM = Math.max(
            point.estimated1RM,
            Math.round(weight * (1 + reps / 30) * 10) / 10,
          )
        }
      }
      byDate.set(session.date, point)
    }
  }

  return [...byDate.values()].sort((a, b) => (a.date < b.date ? -1 : 1))
}

/** 部位 ID -> MuscleGroup の索引 */
export function muscleGroupMap(groups: MuscleGroup[]): Map<string, MuscleGroup> {
  return new Map(groups.map((g) => [g.id, g]))
}

/** 削除済みの部位タグを参照していても落ちないようにするフォールバック */
export const UNKNOWN_GROUP: MuscleGroup = {
  id: '__unknown__',
  name: 'その他',
  color: '#94a3b8',
  order: 999,
}

export interface StreakInfo {
  /** 今週のトレーニング日数 */
  thisWeekDays: number
  /** 今月のトレーニング日数 */
  thisMonthDays: number
  /** 連続でトレーニングしている日数（今日または昨日から遡る） */
  currentStreak: number
  /** 全期間のトレーニング日数 */
  totalDays: number
}

export function summarize(
  sessions: WorkoutSession[],
  weekStartsOn: WeekStart,
): StreakInfo {
  const dates = new Set(sessions.map((s) => s.date))
  const today = parseISODate(todayISO())
  const weekStart = toISODate(startOfWeek(today, weekStartsOn))
  const weekEnd = toISODate(addDays(startOfWeek(today, weekStartsOn), 6))
  const monthPrefix = todayISO().slice(0, 7)

  let thisWeekDays = 0
  let thisMonthDays = 0
  for (const date of dates) {
    if (date >= weekStart && date <= weekEnd) thisWeekDays += 1
    if (date.startsWith(monthPrefix)) thisMonthDays += 1
  }

  let currentStreak = 0
  let cursor = today
  if (!dates.has(toISODate(cursor))) cursor = addDays(cursor, -1)
  while (dates.has(toISODate(cursor))) {
    currentStreak += 1
    cursor = addDays(cursor, -1)
  }

  return { thisWeekDays, thisMonthDays, currentStreak, totalDays: dates.size }
}
