import { useState } from 'react'
import type { Exercise } from '../types'
import { useApp } from '../store/useApp'
import { isExerciseInUse } from '../lib/repository'
import { resolveGroup } from '../lib/colors'
import { RECORD_TYPE_LABELS } from '../lib/format'
import { ExerciseImage } from './ExerciseImage'
import { CustomExerciseForm } from './CustomExerciseForm'
import { ConfirmDialog } from './Sheet'

/** 設定画面の「カスタム種目の管理」（一覧・追加・編集・削除） */
export function CustomExerciseSection() {
  const { data, groupMap, deleteCustomExercise } = useApp()
  const [editing, setEditing] = useState<{ exercise?: Exercise; key: string } | null>(null)
  const [deleting, setDeleting] = useState<Exercise | null>(null)

  const customs = data.customExercises.filter((e) => !e.archived)
  const deletingInUse = deleting ? isExerciseInUse(data, deleting.id) : false

  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm">
      <h2 className="mb-1 text-sm font-semibold text-slate-700">カスタム種目の管理</h2>
      <p className="mb-3 text-xs text-slate-400">
        一覧に無い種目を追加できます。初期収録の種目は編集・削除できません。
      </p>

      {customs.length === 0 ? (
        <p className="rounded-lg bg-slate-50 p-3 text-center text-xs text-slate-400">
          カスタム種目はまだありません
        </p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {customs.map((exercise) => {
            const group = resolveGroup(groupMap, exercise.bodyPart)
            return (
              <li key={exercise.id} className="flex items-center gap-2 py-2">
                <button
                  type="button"
                  onClick={() => setEditing({ exercise, key: exercise.id })}
                  className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
                >
                  <ExerciseImage
                    exercise={exercise}
                    color={group.color}
                    className="h-10 w-10 shrink-0"
                    iconClassName="h-6 w-6"
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-slate-700">
                      {exercise.name}
                    </span>
                    <span className="block text-[11px] text-slate-400">
                      <span style={{ color: group.color }}>{group.name}</span>
                      {' ・ '}
                      {RECORD_TYPE_LABELS[exercise.recordType]}
                    </span>
                  </span>
                </button>
                <button
                  type="button"
                  aria-label={`${exercise.name}を削除`}
                  onClick={() => setDeleting(exercise)}
                  className="rounded p-1.5 text-slate-300 hover:text-red-400"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <button
        type="button"
        onClick={() => setEditing({ key: `new-${Date.now()}` })}
        className="mt-3 w-full rounded-lg border border-dashed border-slate-300 py-2 text-xs font-medium text-slate-500"
      >
        + カスタム種目を追加
      </button>

      {editing && (
        <CustomExerciseForm
          key={editing.key}
          initial={editing.exercise}
          inUse={editing.exercise ? isExerciseInUse(data, editing.exercise.id) : false}
          onSaved={() => setEditing(null)}
          onClose={() => setEditing(null)}
        />
      )}

      <ConfirmDialog
        open={deleting !== null}
        title={`「${deleting?.name ?? ''}」を削除しますか？`}
        message={
          deletingInUse
            ? 'この種目は記録またはルーティンで使われているため、一覧から非表示にします。過去の記録はそのまま残ります。'
            : 'この種目は使われていないので、完全に削除します。'
        }
        confirmLabel="削除する"
        destructive
        onConfirm={async () => {
          const target = deleting
          setDeleting(null)
          if (target) await deleteCustomExercise(target.id)
        }}
        onCancel={() => setDeleting(null)}
      />
    </section>
  )
}
