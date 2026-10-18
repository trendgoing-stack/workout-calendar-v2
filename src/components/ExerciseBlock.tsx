import { useState } from 'react'
import type { Exercise, MuscleGroup, SessionExercise, SetEntry, WeightUnit } from '../types'
import type { SetField } from '../lib/setValidation'
import { createSet } from '../lib/factories'
import { formatExerciseTotal, formatSeconds } from '../lib/format'
import { Stopwatch } from './Stopwatch'
import { resolveGroup } from '../lib/colors'
import { ExerciseImage } from './ExerciseImage'
import { MuscleTagPicker } from './MuscleTag'

/**
 * 記録入力画面・テンプレート編集画面の1種目ぶんの入力ブロック。
 * セットの入力欄は記録タイプで切り替える。
 * - weightReps: 重量・回数
 * - reps: 回数（加重可の種目は「加重」トグル。ON で重量欄を出す）
 * - time: 秒数
 */
export function ExerciseBlock({
  entry,
  exercise,
  muscleGroups,
  groupMap,
  unit,
  invalid,
  onChange,
  onRemove,
  showStopwatch = false,
}: {
  entry: SessionExercise
  exercise: Exercise
  muscleGroups: MuscleGroup[]
  groupMap: Map<string, MuscleGroup>
  unit: WeightUnit
  /** 不正な欄（セット ID → 欄）。赤枠で表示する */
  invalid?: Map<string, SetField[]>
  onChange: (updater: (entry: SessionExercise) => SessionExercise) => void
  onRemove: () => void
  /** 秒数の種目にストップウォッチを出す（記録入力画面だけ） */
  showStopwatch?: boolean
}) {
  const [hintOpen, setHintOpen] = useState(false)
  const group = resolveGroup(groupMap, exercise.bodyPart)
  const recordType = entry.recordTypeSnapshot
  const canWeight = recordType === 'reps' && exercise.allowOptionalWeight
  const showWeight = recordType === 'weightReps' || (recordType === 'reps' && entry.weighted)
  const showReps = recordType !== 'time'
  const repsLabel = exercise.unilateral ? '回数（片側）' : '回数'
  const total = formatExerciseTotal(
    entry.sets,
    recordType,
    entry.weighted,
    unit,
    exercise.unilateral,
  )

  const updateSet = (setId: string, field: SetField, raw: string) => {
    const value = raw === '' ? undefined : Number(raw)
    onChange((e) => ({
      ...e,
      sets: e.sets.map((s) => {
        if (s.id !== setId) return s
        const next: SetEntry = { ...s }
        if (value === undefined || Number.isNaN(value)) delete next[field]
        else next[field] = value
        return next
      }),
    }))
  }

  const inputClass = (setId: string, field: SetField) =>
    `w-full min-w-0 flex-1 rounded-lg border bg-white px-2 py-2 text-center outline-none focus:border-indigo-400 ${
      invalid?.get(setId)?.includes(field) ? 'border-red-500 ring-1 ring-red-400' : 'border-slate-200'
    }`

  return (
    <article className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
      <div className="flex items-start gap-2.5">
        <ExerciseImage
          exercise={exercise}
          color={group.color}
          className="h-12 w-12 shrink-0"
          iconClassName="h-7 w-7"
        />
        <div className="min-w-0 flex-1">
          <div className="font-semibold leading-snug text-slate-800">
            {exercise.builtIn || !exercise.archived ? exercise.name : entry.nameSnapshot}
          </div>
          {exercise.hint && (
            <button
              type="button"
              onClick={() => setHintOpen((v) => !v)}
              aria-expanded={hintOpen}
              className="mt-0.5 text-[11px] font-medium text-indigo-600"
            >
              {hintOpen ? 'ヒントを閉じる' : 'ヒントを見る'}
            </button>
          )}
        </div>
        <button
          type="button"
          aria-label={`${exercise.name}を削除`}
          onClick={onRemove}
          className="rounded-full p-1.5 text-slate-300 hover:bg-slate-200 hover:text-slate-500"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
      {hintOpen && (
        <p className="rounded-lg bg-white px-3 py-2 text-xs leading-relaxed text-slate-600">
          {exercise.hint}
        </p>
      )}

      <MuscleTagPicker
        groups={muscleGroups}
        selected={entry.muscleGroupIds}
        onToggle={(id) =>
          onChange((e) => ({
            ...e,
            muscleGroupIds: e.muscleGroupIds.includes(id)
              ? e.muscleGroupIds.filter((v) => v !== id)
              : [...e.muscleGroupIds, id],
          }))
        }
      />

      {canWeight && (
        <label className="flex items-center justify-between rounded-lg bg-white px-3 py-2">
          <span className="text-sm text-slate-700">加重</span>
          <input
            type="checkbox"
            role="switch"
            checked={entry.weighted === true}
            onChange={(ev) =>
              onChange((e) => {
                const { weighted: _weighted, ...rest } = e
                return ev.target.checked ? { ...rest, weighted: true } : rest
              })
            }
            className="h-5 w-5 accent-indigo-600"
          />
        </label>
      )}

      <div className="space-y-1.5">
        <div className="flex items-center gap-2 px-1 text-[11px] text-slate-400">
          <span className="w-6">セット</span>
          {showWeight && <span className="flex-1">重量({unit})</span>}
          {showReps && <span className="flex-1">{repsLabel}</span>}
          {recordType === 'time' && <span className="flex-1">秒数</span>}
          <span className="w-7" />
        </div>
        {entry.sets.map((set, setIndex) => (
          <div key={set.id} className="flex items-center gap-2">
            <span className="w-6 text-center text-xs font-medium text-slate-400">
              {setIndex + 1}
            </span>
            {showWeight && (
              <input
                type="number"
                inputMode="decimal"
                step="0.5"
                value={set.weight ?? ''}
                placeholder="-"
                aria-label={`${setIndex + 1}セット目の重量`}
                className={inputClass(set.id, 'weight')}
                onChange={(e) => updateSet(set.id, 'weight', e.target.value)}
              />
            )}
            {showReps && (
              <input
                type="number"
                inputMode="numeric"
                value={set.reps ?? ''}
                placeholder="-"
                aria-label={`${setIndex + 1}セット目の${repsLabel}`}
                className={inputClass(set.id, 'reps')}
                onChange={(e) => updateSet(set.id, 'reps', e.target.value)}
              />
            )}
            {recordType === 'time' && (
              <div className="flex flex-1 items-center gap-2">
                <input
                  type="number"
                  inputMode="numeric"
                  value={set.seconds ?? ''}
                  placeholder="-"
                  aria-label={`${setIndex + 1}セット目の秒数`}
                  className={inputClass(set.id, 'seconds')}
                  onChange={(e) => updateSet(set.id, 'seconds', e.target.value)}
                />
                <span className="w-12 shrink-0 text-xs text-slate-400">
                  {set.seconds !== undefined && set.seconds >= 60 ? formatSeconds(set.seconds) : ''}
                </span>
              </div>
            )}
            <button
              type="button"
              aria-label={`${setIndex + 1}セット目を削除`}
              disabled={entry.sets.length <= 1}
              onClick={() =>
                onChange((e) => ({ ...e, sets: e.sets.filter((s) => s.id !== set.id) }))
              }
              className="w-7 rounded-full py-2 text-slate-300 hover:text-red-400 disabled:invisible"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="mx-auto">
                <path d="M5 12h14" />
              </svg>
            </button>
          </div>
        ))}
        {total && (
          <div className="px-1 text-right text-xs font-medium text-slate-500" aria-live="polite">
            {total}
          </div>
        )}
        {showStopwatch && recordType === 'time' && (
          <Stopwatch
            onRecord={(seconds) =>
              onChange((e) => {
                // 秒数が空のセットがあればそこに、無ければ新しいセットとして記録する
                const index = e.sets.findIndex((s) => s.seconds === undefined)
                if (index === -1) return { ...e, sets: [...e.sets, { ...createSet(), seconds }] }
                return {
                  ...e,
                  sets: e.sets.map((s, i) => (i === index ? { ...s, seconds } : s)),
                }
              })
            }
          />
        )}
        <button
          type="button"
          onClick={() => onChange((e) => ({ ...e, sets: [...e.sets, createSet(e.sets.at(-1))] }))}
          className="w-full rounded-lg border border-dashed border-slate-300 py-2 text-xs font-medium text-slate-500"
        >
          + セットを追加
        </button>
      </div>

      <input
        type="text"
        value={entry.memo ?? ''}
        placeholder="この種目のメモ（任意）"
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-indigo-400"
        onChange={(ev) =>
          onChange((e) => {
            const { memo: _memo, ...rest } = e
            return ev.target.value ? { ...rest, memo: ev.target.value } : rest
          })
        }
      />
    </article>
  )
}
