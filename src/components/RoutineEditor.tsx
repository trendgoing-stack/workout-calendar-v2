import { useState } from 'react'
import type { Exercise, Routine, RoutineExercise } from '../types'
import { useApp } from '../store/useApp'
import { createRoutine, createSessionExercise } from '../lib/factories'
import { resolveExercise } from '../lib/exerciseCatalog'
import { stripUnusedFields } from '../lib/setValidation'
import { ConfirmDialog, Sheet } from './Sheet'
import { ExerciseBlock } from './ExerciseBlock'
import { ExercisePicker } from './ExercisePicker'

/**
 * ルーティン（テンプレート）の作成・編集シート。
 * セットの値は空欄のままでもよい（空欄なら、記録するときに前回の値が入る）。
 */
export function RoutineEditor({
  open,
  routine,
  onClose,
}: {
  open: boolean
  routine: Routine | null
  onClose: () => void
}) {
  const { muscleGroups, groupMap, exerciseById, settings, saveRoutine, deleteRoutine } = useApp()
  const [draft, setDraft] = useState<Routine>(() => routine ?? createRoutine())
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)

  const updateExercise = (
    id: string,
    updater: (exercise: RoutineExercise) => RoutineExercise,
  ) =>
    setDraft((prev) => ({
      ...prev,
      exercises: prev.exercises.map((e) => (e.id === id ? updater(e) : e)),
    }))

  const addExercises = (exercises: Exercise[]) => {
    setDraft((prev) => ({
      ...prev,
      // テンプレートの値は空欄から始める（記録するときに前回値で埋まる）
      exercises: [...prev.exercises, ...exercises.map((e) => createSessionExercise(e))],
    }))
    setPickerOpen(false)
  }

  const canSave = draft.name.trim().length > 0 && draft.exercises.length > 0

  const handleSave = async () => {
    if (!canSave) return
    await saveRoutine({
      ...draft,
      name: draft.name.trim(),
      exercises: draft.exercises.map((e) => ({
        ...e,
        sets: e.sets.map((s) => stripUnusedFields(s, e.recordTypeSnapshot, e.weighted)),
      })),
    })
    onClose()
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={routine ? 'ルーティンを編集' : 'ルーティンを作成'}
      footer={
        <div className="flex gap-2">
          {routine && (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-500"
            >
              削除
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className="flex-1 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white disabled:bg-slate-200 disabled:text-slate-400"
          >
            保存
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-500">ルーティン名</span>
          <input
            type="text"
            value={draft.name}
            placeholder="例: 胸の日"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 font-medium outline-none focus:border-indigo-400"
            onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-500">メモ（任意）</span>
          <input
            type="text"
            value={draft.description}
            placeholder="例: 自宅でのプッシュ系"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-indigo-400"
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, description: e.target.value }))
            }
          />
        </label>

        <p className="text-[11px] leading-relaxed text-slate-400">
          セットの値を空欄にしておくと、記録するときに前回の値が入ります。
        </p>

        {draft.exercises.map((entry) => (
          <ExerciseBlock
            key={entry.id}
            entry={entry}
            exercise={resolveExercise(exerciseById, entry)}
            muscleGroups={muscleGroups}
            groupMap={groupMap}
            unit={settings.weightUnit}
            onChange={(updater) => updateExercise(entry.id, updater)}
            onRemove={() =>
              setDraft((prev) => ({
                ...prev,
                exercises: prev.exercises.filter((e) => e.id !== entry.id),
              }))
            }
          />
        ))}

        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="w-full rounded-xl border border-dashed border-indigo-300 py-3 text-sm font-semibold text-indigo-600"
        >
          + 種目を追加
        </button>
      </div>

      {pickerOpen && (
        <ExercisePicker
          addedIds={new Set(draft.exercises.map((e) => e.exerciseId))}
          onConfirm={addExercises}
          onClose={() => setPickerOpen(false)}
        />
      )}

      <ConfirmDialog
        open={confirmDelete}
        title="このルーティンを削除しますか？"
        message="過去の記録はそのまま残ります。"
        confirmLabel="削除する"
        destructive
        onConfirm={async () => {
          setConfirmDelete(false)
          if (routine) await deleteRoutine(routine.id)
          onClose()
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </Sheet>
  )
}
