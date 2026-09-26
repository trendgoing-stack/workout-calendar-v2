import type { MuscleGroup, WeightUnit, WorkoutSession } from '../types'
import { useApp } from '../store/useApp'
import { formatDateLabel } from '../lib/date'
import { formatSet } from '../lib/format'
import { resolveExercise } from '../lib/exerciseCatalog'
import { sessionMuscleGroupIds, sessionSetCount, sessionVolume } from '../lib/selectors'
import { MuscleTag } from './MuscleTag'
import { resolveGroup } from '../lib/colors'

export function SessionCard({
  session,
  groupMap,
  unit,
  showDate = false,
  onClick,
}: {
  session: WorkoutSession
  groupMap: Map<string, MuscleGroup>
  unit: WeightUnit
  showDate?: boolean
  onClick?: () => void
}) {
  const { exerciseById } = useApp()
  const groupIds = sessionMuscleGroupIds(session)
  const volume = sessionVolume(session)

  const content = (
    <>
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {showDate && (
            <span className="text-sm font-semibold text-slate-700">
              {formatDateLabel(session.date)}
            </span>
          )}
          {groupIds.map((id) => (
            <MuscleTag key={id} group={resolveGroup(groupMap, id)} size="sm" />
          ))}
        </div>
        <span className="shrink-0 text-[11px] text-slate-400">
          {session.exercises.length}種目 / {sessionSetCount(session)}セット
        </span>
      </div>

      <ul className="mt-2 space-y-1.5">
        {session.exercises.map((entry) => {
          const exercise = resolveExercise(exerciseById, entry)
          // 非表示にしたカスタム種目は、記録時点の名前で表示し続ける
          const name = exercise.archived ? entry.nameSnapshot : exercise.name
          const sets =
            entry.sets.length === 0
              ? '記録なし'
              : entry.sets
                  .map((set) =>
                    formatSet(set, entry.recordTypeSnapshot, unit, exercise.unilateral),
                  )
                  .join(' / ')
          return (
            <li key={entry.id} className="text-sm">
              <span className="font-medium text-slate-700">{name}</span>
              {entry.weighted && (
                <span className="ml-1 rounded bg-slate-100 px-1 text-[10px] text-slate-500">
                  加重
                </span>
              )}
              <span className="ml-2 text-xs text-slate-500">{sets}</span>
              {entry.memo && (
                <span className="ml-2 text-xs text-slate-400">📝{entry.memo}</span>
              )}
            </li>
          )
        })}
      </ul>

      {(session.memo || volume > 0) && (
        <div className="mt-2 flex items-center justify-between gap-2 border-t border-slate-100 pt-2">
          <span className="truncate text-xs text-slate-500">{session.memo}</span>
          {volume > 0 && (
            <span className="shrink-0 text-[11px] text-slate-400">
              総ボリューム {volume.toLocaleString()}
              {unit}
            </span>
          )}
        </div>
      )}
    </>
  )

  if (!onClick) {
    return <div className="rounded-xl bg-white p-3 shadow-sm">{content}</div>
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-xl bg-white p-3 text-left shadow-sm transition-colors active:bg-slate-50"
    >
      {content}
    </button>
  )
}
