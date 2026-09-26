import { useMemo, useState } from 'react'
import type { Exercise, RecordType } from '../types'
import { useApp } from '../store/useApp'
import {
  buildBuckets,
  exerciseProgress,
  frequencyByPeriod,
  summarize,
  usedExerciseIds,
} from '../lib/selectors'
import type { ExerciseProgressPoint } from '../lib/selectors'
import { LineChart } from '../components/Charts'
import { StackedBarChart } from '../components/Charts'
import { SessionCard } from '../components/SessionCard'
import { MuscleTag } from '../components/MuscleTag'
import { formatDateLabel } from '../lib/date'
import { formatSeconds } from '../lib/format'
import { resolveExercise } from '../lib/exerciseCatalog'
import { resolveGroup } from '../lib/colors'

type Period = 'week' | 'month'
type WeightMetric = 'maxWeight' | 'estimated1RM' | 'volume'
type Metric = WeightMetric | 'maxReps' | 'maxSeconds'

const WEIGHT_METRIC_LABELS: Record<WeightMetric, string> = {
  maxWeight: '最大重量',
  estimated1RM: '推定1RM',
  volume: 'ボリューム',
}

/** 記録タイプごとの指標（weightReps は選択式） */
function metricFor(recordType: RecordType, weightMetric: WeightMetric): Metric {
  if (recordType === 'weightReps') return weightMetric
  if (recordType === 'reps') return 'maxReps'
  return 'maxSeconds'
}

const METRIC_TITLES: Record<Metric, string> = {
  ...WEIGHT_METRIC_LABELS,
  maxReps: '1セットの最大回数',
  maxSeconds: '最長秒数',
}

const toPoints = (progress: ExerciseProgressPoint[], metric: Metric) =>
  progress
    .filter((p) => p[metric] > 0)
    .map((p) => ({ label: formatDateLabel(p.date).replace(/\(.\)$/, ''), value: p[metric] }))

export function StatsPage() {
  const { sessions, muscleGroups, groupMap, settings, exerciseById } = useApp()
  const [period, setPeriod] = useState<Period>('week')
  const [weightMetric, setWeightMetric] = useState<WeightMetric>('maxWeight')
  const [selectedExercise, setSelectedExercise] = useState('')
  const unit = settings.weightUnit

  /** 記録のある種目（よく行う順） */
  const usedIds = useMemo(() => usedExerciseIds(sessions), [sessions])
  /** 種目の選択肢を部位ごとにまとめたもの（部位の表示順） */
  const exerciseGroups = useMemo(() => {
    const byPart = new Map<string, Exercise[]>()
    for (const id of usedIds) {
      const entry = sessions.flatMap((s) => s.exercises).find((e) => e.exerciseId === id)
      if (!entry) continue
      const exercise = resolveExercise(exerciseById, entry)
      const part = exercise.bodyPart
      const list = byPart.get(part)
      if (list) list.push(exercise)
      else byPart.set(part, [exercise])
    }
    const order = new Map(muscleGroups.map((g, i) => [g.id, i]))
    return [...byPart.entries()]
      .sort((a, b) => (order.get(a[0]) ?? 999) - (order.get(b[0]) ?? 999))
      .map(([part, exercises]) => ({ group: resolveGroup(groupMap, part), exercises }))
  }, [usedIds, sessions, exerciseById, muscleGroups, groupMap])

  // 未選択、または選択中の種目が消えた場合は、いちばんよく行っている種目を表示する
  const exerciseId =
    selectedExercise && usedIds.includes(selectedExercise) ? selectedExercise : (usedIds[0] ?? '')
  const exercise = exerciseGroups
    .flatMap((g) => g.exercises)
    .find((e) => e.id === exerciseId)
  const recordType = exercise?.recordType ?? 'weightReps'
  const metric = metricFor(recordType, weightMetric)

  const rows = useMemo(() => {
    const buckets = buildBuckets(
      period,
      period === 'week' ? 12 : 6,
      settings.weekStartsOn,
    )
    return frequencyByPeriod(sessions, buckets)
  }, [sessions, period, settings.weekStartsOn])

  const totalsByGroup = useMemo(() => {
    const totals = new Map<string, number>()
    for (const row of rows) {
      for (const [id, count] of Object.entries(row.countsByGroup)) {
        totals.set(id, (totals.get(id) ?? 0) + count)
      }
    }
    return totals
  }, [rows])

  const progress = useMemo(
    () => (exerciseId ? exerciseProgress(sessions, exerciseId) : []),
    [sessions, exerciseId],
  )
  const points = useMemo(() => toPoints(progress, metric), [progress, metric])
  /** 加重した日の最大重量（reps タイプで加重した日だけ） */
  const weightedPoints = useMemo(
    () => (recordType === 'reps' ? toPoints(progress, 'maxWeight') : []),
    [progress, recordType],
  )

  const stats = useMemo(
    () => summarize(sessions, settings.weekStartsOn),
    [sessions, settings.weekStartsOn],
  )

  const recent = sessions.slice(0, 10)
  const best = progress.reduce((acc, p) => (p[metric] > acc ? p[metric] : acc), 0)
  const bestLabel =
    metric === 'maxSeconds'
      ? formatSeconds(best)
      : metric === 'maxReps'
        ? `${best}回`
        : `${(Math.round(best * 10) / 10).toLocaleString()}${unit}`
  const unitLabel = metric === 'maxSeconds' ? '秒' : metric === 'maxReps' ? '回' : unit

  return (
    <div className="space-y-4 px-4 pb-4 pt-4">
      <header className="safe-top">
        <h1 className="text-xl font-bold text-slate-800">統計</h1>
      </header>

      <section className="grid grid-cols-4 gap-2">
        {[
          ['今週', stats.thisWeekDays],
          ['今月', stats.thisMonthDays],
          ['連続', stats.currentStreak],
          ['通算', stats.totalDays],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl bg-white p-2 text-center shadow-sm">
            <div className="text-[11px] text-slate-400">{label}</div>
            <div className="text-lg font-bold text-slate-800">
              {value}
              <span className="ml-0.5 text-[11px] font-normal text-slate-400">日</span>
            </div>
          </div>
        ))}
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">部位ごとの頻度</h2>
          <div className="flex rounded-lg bg-slate-100 p-0.5 text-xs">
            {(['week', 'month'] as Period[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setPeriod(key)}
                className={`rounded-md px-3 py-1 font-medium ${
                  period === key ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'
                }`}
              >
                {key === 'week' ? '週別' : '月別'}
              </button>
            ))}
          </div>
        </div>

        <StackedBarChart rows={rows} groups={muscleGroups} groupMap={groupMap} />

        <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5 border-t border-slate-100 pt-3">
          {muscleGroups.map((group) => (
            <li key={group.id} className="flex items-center gap-1">
              <MuscleTag group={group} size="sm" />
              <span className="text-[11px] text-slate-500">
                {totalsByGroup.get(group.id) ?? 0}日
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">種目ごとの推移</h2>

        {usedIds.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">
            記録を追加するとグラフが表示されます
          </p>
        ) : (
          <>
            <div className="flex gap-2">
              <select
                value={exerciseId}
                aria-label="種目"
                onChange={(e) => setSelectedExercise(e.target.value)}
                className="min-w-0 flex-1 rounded-lg border border-slate-200 px-2 py-2 outline-none focus:border-indigo-400"
              >
                {exerciseGroups.map(({ group, exercises }) => (
                  <optgroup key={group.id} label={group.name}>
                    {exercises.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              {recordType === 'weightReps' && (
                <select
                  value={weightMetric}
                  aria-label="指標"
                  onChange={(e) => setWeightMetric(e.target.value as WeightMetric)}
                  className="rounded-lg border border-slate-200 px-2 py-2 outline-none focus:border-indigo-400"
                >
                  {(Object.keys(WEIGHT_METRIC_LABELS) as WeightMetric[]).map((key) => (
                    <option key={key} value={key}>
                      {WEIGHT_METRIC_LABELS[key]}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="mt-2 text-xs text-slate-400">
              {METRIC_TITLES[metric]} ・ 最高 {bestLabel} ・ 記録 {progress.length}回
            </div>

            <LineChart points={points} unitLabel={metric === 'volume' ? '' : unitLabel} />

            {weightedPoints.length > 0 && (
              <div className="mt-3 border-t border-slate-100 pt-3">
                <div className="text-xs text-slate-400">加重した日の最大重量</div>
                <LineChart points={weightedPoints} unitLabel={unit} color="#f59e0b" height={140} />
              </div>
            )}
          </>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="px-1 text-sm font-semibold text-slate-700">直近のトレーニング</h2>
        {recent.length === 0 ? (
          <p className="rounded-xl bg-white p-6 text-center text-sm text-slate-400 shadow-sm">
            まだ記録がありません
          </p>
        ) : (
          recent.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              groupMap={groupMap}
              unit={settings.weightUnit}
              showDate
            />
          ))
        )}
      </section>
    </div>
  )
}
