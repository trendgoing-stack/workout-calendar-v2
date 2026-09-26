import type { Exercise, MuscleGroup } from '../types'
import { RECORD_TYPE_LABELS } from '../lib/format'
import { ExerciseImage } from './ExerciseImage'
import { MuscleTag } from './MuscleTag'

/** 種目の詳細（大きいイラストとヒント全文） */
export function ExerciseDetailDialog({
  exercise,
  group,
  selected,
  onToggle,
  onClose,
}: {
  exercise: Exercise
  group: MuscleGroup
  selected?: boolean
  /** 渡したときだけ「選択する／選択を外す」ボタンを出す */
  onToggle?: () => void
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-6">
      <button
        type="button"
        aria-label="閉じる"
        className="absolute inset-0 bg-slate-900/50"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-label={exercise.name}
        className="relative w-full max-w-sm rounded-2xl bg-white p-4 shadow-xl"
      >
        <ExerciseImage
          exercise={exercise}
          color={group.color}
          className="mx-auto w-full max-w-[260px]"
        />
        <h3 className="mt-3 text-base font-semibold text-slate-800">{exercise.name}</h3>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <MuscleTag group={group} size="sm" />
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
            {RECORD_TYPE_LABELS[exercise.recordType]}
          </span>
          {exercise.allowOptionalWeight && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
              加重できる
            </span>
          )}
          {exercise.unilateral && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
              片側ずつ（回数は片側）
            </span>
          )}
        </div>
        {exercise.hint && (
          <p className="mt-2 text-sm leading-relaxed text-slate-600">{exercise.hint}</p>
        )}
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl bg-slate-100 py-2.5 text-sm font-medium text-slate-600"
          >
            閉じる
          </button>
          {onToggle && (
            <button
              type="button"
              onClick={() => {
                onToggle()
                onClose()
              }}
              className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white"
            >
              {selected ? '選択を外す' : '選択する'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
