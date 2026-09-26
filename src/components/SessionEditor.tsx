import { useMemo, useState } from 'react'
import type { Exercise, ISODate, SessionExercise, WorkoutSession } from '../types'
import { useApp } from '../store/useApp'
import { createSession, createSessionExercise, routineFromSession } from '../lib/factories'
import { lastRecordOf } from '../lib/selectors'
import { resolveExercise } from '../lib/exerciseCatalog'
import { invalidFieldsOf, stripUnusedFields } from '../lib/setValidation'
import type { SetField } from '../lib/setValidation'
import { ConfirmDialog, Sheet } from './Sheet'
import { ExerciseBlock } from './ExerciseBlock'
import { ExercisePicker } from './ExercisePicker'

interface Props {
  open: boolean
  /** 新規作成する日付 */
  date: ISODate
  /** 編集対象。null なら新規作成 */
  session: WorkoutSession | null
  onClose: () => void
}

/** 保存用に、記録タイプで使わない値を取り除く */
function cleanSession(session: WorkoutSession): WorkoutSession {
  return {
    ...session,
    memo: session.memo.trim(),
    exercises: session.exercises.map((e) => ({
      ...e,
      sets: e.sets.map((s) => stripUnusedFields(s, e.recordTypeSnapshot, e.weighted)),
    })),
  }
}

/** トレーニング記録の入力・編集画面 */
export function SessionEditor({ open, date, session, onClose }: Props) {
  const {
    muscleGroups,
    groupMap,
    sessions,
    sessionsByDate,
    exerciseById,
    saveSession,
    deleteSession,
    saveRoutine,
    settings,
  } = useApp()

  // シートを開くたびに初期値を作り直す（key で再マウントされる想定）
  const [draft, setDraft] = useState<WorkoutSession>(() => session ?? createSession(date))
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [saveAsRoutine, setSaveAsRoutine] = useState(false)
  const [routineName, setRoutineName] = useState('')
  const [pickerOpen, setPickerOpen] = useState(false)
  /** 一度保存しようとして失敗したら、以後は入力のたびに赤枠を更新する */
  const [showErrors, setShowErrors] = useState(false)
  const unit = settings.weightUnit

  const invalidByExercise = useMemo(() => {
    const map = new Map<string, Map<string, SetField[]>>()
    for (const e of draft.exercises) {
      const bad = invalidFieldsOf(e, unit)
      if (bad.size > 0) map.set(e.id, bad)
    }
    return map
  }, [draft.exercises, unit])

  /** 同じ日の記録にすでに入っている種目（編集中の下書きと、同じ日のほかの記録） */
  const addedIds = useMemo(() => {
    const ids = new Set(draft.exercises.map((e) => e.exerciseId))
    for (const s of sessionsByDate.get(draft.date) ?? []) {
      if (s.id === draft.id) continue
      for (const e of s.exercises) ids.add(e.exerciseId)
    }
    return ids
  }, [draft, sessionsByDate])

  const updateExercise = (
    exerciseId: string,
    updater: (exercise: SessionExercise) => SessionExercise,
  ) => {
    setDraft((prev) => ({
      ...prev,
      exercises: prev.exercises.map((e) => (e.id === exerciseId ? updater(e) : e)),
    }))
  }

  const addExercises = (exercises: Exercise[]) => {
    setDraft((prev) => ({
      ...prev,
      exercises: [
        ...prev.exercises,
        ...exercises.map((exercise) =>
          createSessionExercise(exercise, lastRecordOf(sessions, exercise.id, prev.id)),
        ),
      ],
    }))
    setPickerOpen(false)
  }

  const canSave = draft.exercises.length > 0 || draft.memo.trim().length > 0

  const handleSave = async () => {
    if (!canSave) return
    if (invalidByExercise.size > 0) {
      setShowErrors(true)
      return
    }
    await saveSession(cleanSession(draft))
    onClose()
  }

  const handleDelete = async () => {
    setConfirmDelete(false)
    if (session) await deleteSession(session.id)
    onClose()
  }

  const handleSaveRoutine = async () => {
    const name = routineName.trim()
    if (!name) return
    await saveRoutine(routineFromSession(cleanSession(draft), name))
    setSaveAsRoutine(false)
    setRoutineName('')
  }

  const errorVisible = showErrors && invalidByExercise.size > 0

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={session ? '記録を編集' : '記録を追加'}
      footer={
        <div className="space-y-2">
          {errorVisible && (
            <p className="text-center text-xs text-red-500">
              赤枠の欄を入力してください（入力できる範囲を超えている値もあります）
            </p>
          )}
          <div className="flex gap-2">
            {session && (
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
        </div>
      }
    >
      <div className="space-y-4">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-500">日付</span>
          <input
            type="date"
            value={draft.date}
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, date: e.target.value as ISODate }))
            }
            className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-indigo-400"
          />
        </label>

        {draft.exercises.map((entry) => (
          <ExerciseBlock
            key={entry.id}
            entry={entry}
            exercise={resolveExercise(exerciseById, entry)}
            muscleGroups={muscleGroups}
            groupMap={groupMap}
            unit={unit}
            invalid={showErrors ? invalidByExercise.get(entry.id) : undefined}
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

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-500">メモ</span>
          <textarea
            value={draft.memo}
            rows={3}
            placeholder="体調・調子など（任意）"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-indigo-400"
            onChange={(e) => setDraft((prev) => ({ ...prev, memo: e.target.value }))}
          />
        </label>

        {draft.exercises.length > 0 && (
          <div className="rounded-xl bg-slate-50 p-3">
            {saveAsRoutine ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={routineName}
                  placeholder="ルーティン名（例: 胸の日）"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-indigo-400"
                  onChange={(e) => setRoutineName(e.target.value)}
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSaveAsRoutine(false)}
                    className="flex-1 rounded-lg bg-white py-2 text-xs font-medium text-slate-500"
                  >
                    キャンセル
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveRoutine}
                    disabled={!routineName.trim()}
                    className="flex-1 rounded-lg bg-indigo-600 py-2 text-xs font-semibold text-white disabled:bg-slate-200 disabled:text-slate-400"
                  >
                    ルーティンに保存
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setRoutineName(draft.memo.trim())
                  setSaveAsRoutine(true)
                }}
                className="w-full text-xs font-medium text-slate-500"
              >
                この内容をルーティンとして保存する
              </button>
            )}
          </div>
        )}
      </div>

      {pickerOpen && (
        <ExercisePicker
          addedIds={addedIds}
          onConfirm={addExercises}
          onClose={() => setPickerOpen(false)}
        />
      )}

      <ConfirmDialog
        open={confirmDelete}
        title="この記録を削除しますか？"
        message="削除すると元に戻せません。"
        confirmLabel="削除する"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </Sheet>
  )
}
