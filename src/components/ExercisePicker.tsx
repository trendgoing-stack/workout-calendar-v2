import { useMemo, useState } from 'react'
import type { Exercise } from '../types'
import { useApp } from '../store/useApp'
import { useScrollLock } from '../hooks/useScrollLock'
import { searchExercises } from '../lib/exerciseCatalog'
import { recentExerciseIds } from '../lib/selectors'
import { resolveGroup } from '../lib/colors'
import { recordTypeBadge } from '../lib/format'
import { ExerciseImage } from './ExerciseImage'
import { ExerciseDetailDialog } from './ExerciseDetailDialog'
import { CustomExerciseForm } from './CustomExerciseForm'

/** 部位タブに並べる部位（マスタ種目がある部位） */
const BODY_PART_TABS = ['chest', 'back', 'shoulder', 'arm', 'abs', 'leg']

type Tab = 'all' | 'recent' | 'custom' | string

/**
 * 種目選択シート（全画面）。複数選択して「n種目を追加」で確定する。
 * 記録入力画面とテンプレート編集画面の「＋種目を追加」から開く。
 */
export function ExercisePicker({
  addedIds,
  onConfirm,
  onClose,
}: {
  /** すでに追加済みの種目（「追加済み」バッジを付ける。重複追加は可能） */
  addedIds: Set<string>
  onConfirm: (exercises: Exercise[]) => void
  onClose: () => void
}) {
  const { catalog, exerciseById, sessions, groupMap, muscleGroups } = useApp()
  useScrollLock(true)

  const recentIds = useMemo(
    () =>
      recentExerciseIds(sessions, 30)
        .filter((id) => {
          const e = exerciseById.get(id)
          return e && !e.archived
        })
        .slice(0, 10),
    [sessions, exerciseById],
  )
  const [tab, setTab] = useState<Tab>(() => (recentIds.length > 0 ? 'recent' : 'all'))
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [detail, setDetail] = useState<Exercise | null>(null)
  const [creating, setCreating] = useState(false)

  const groupOrder = useMemo(
    () => new Map(muscleGroups.map((g, i) => [g.id, i])),
    [muscleGroups],
  )
  /** 表示できる種目（非表示のカスタム種目を除く）を部位順・部位内の順に並べたもの */
  const active = useMemo(
    () =>
      catalog
        .filter((e) => !e.archived)
        .sort(
          (a, b) =>
            (groupOrder.get(a.bodyPart) ?? 999) - (groupOrder.get(b.bodyPart) ?? 999) ||
            Number(b.builtIn) - Number(a.builtIn) ||
            a.order - b.order,
        ),
    [catalog, groupOrder],
  )

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'all', label: 'すべて' },
    { key: 'recent', label: '最近' },
    ...BODY_PART_TABS.map((id) => ({ key: id, label: groupMap.get(id)?.name ?? id })),
    { key: 'custom', label: 'カスタム' },
  ]

  const searching = query.trim().length > 0
  const list = useMemo(() => {
    // 検索中はタブに関係なく全種目から探す
    if (searching) return searchExercises(active, query)
    if (tab === 'all') return active
    if (tab === 'recent') {
      return recentIds.map((id) => exerciseById.get(id)).filter((e): e is Exercise => !!e)
    }
    if (tab === 'custom') return active.filter((e) => !e.builtIn)
    return active.filter((e) => e.bodyPart === tab)
  }, [searching, active, query, tab, recentIds, exerciseById])

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]))

  const confirm = () => {
    const exercises = selected
      .map((id) => exerciseById.get(id))
      .filter((e): e is Exercise => !!e)
    if (exercises.length > 0) onConfirm(exercises)
  }

  return (
    <div className="fixed inset-0 z-[55] flex flex-col bg-[#f4f5f7]">
      <header className="safe-top border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-lg px-4 pt-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-800">種目を選択</h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100"
              aria-label="閉じる"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="relative mt-2">
            <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              type="search"
              value={query}
              placeholder="種目名・読み・別名で検索"
              enterKeyHint="search"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 outline-none focus:border-indigo-400 focus:bg-white"
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <nav className="-mx-4 mt-2 flex gap-1 overflow-x-auto px-4 pb-2" aria-label="部位">
            {tabs.map((t) => {
              const isOn = !searching && tab === t.key
              return (
                <button
                  key={t.key}
                  type="button"
                  aria-pressed={isOn}
                  onClick={() => {
                    setQuery('')
                    setTab(t.key)
                  }}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${
                    isOn ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {t.label}
                </button>
              )
            })}
          </nav>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto max-w-lg px-4 py-3">
          {list.length === 0 && (
            <div className="py-6 text-center">
              <p className="text-sm text-slate-500">
                {searching
                  ? `「${query.trim()}」に一致する種目はありません`
                  : tab === 'recent'
                    ? 'まだ記録がありません'
                    : 'この部位の種目はまだありません'}
              </p>
              {searching && (
                <button
                  type="button"
                  onClick={() => setCreating(true)}
                  className="mt-3 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm"
                >
                  ＋「{query.trim()}」を新しい種目として作成
                </button>
              )}
            </div>
          )}

          <ul className="grid grid-cols-2 gap-2">
            {list.map((exercise) => {
              const group = resolveGroup(groupMap, exercise.bodyPart)
              const isSelected = selected.includes(exercise.id)
              return (
                <li key={exercise.id} className="relative">
                  <button
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => toggle(exercise.id)}
                    className={`flex h-full w-full flex-col overflow-hidden rounded-xl border-2 bg-white text-left shadow-sm ${
                      isSelected ? 'border-indigo-500' : 'border-transparent'
                    }`}
                  >
                    <div className="h-1 w-full" style={{ backgroundColor: group.color }} />
                    <div className="p-2">
                      <ExerciseImage exercise={exercise} color={group.color} className="w-full" />
                      <div className="mt-1.5 line-clamp-2 min-h-[2.5em] text-[13px] font-semibold leading-tight text-slate-800">
                        {exercise.name}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-1">
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                          {recordTypeBadge(exercise.recordType)}
                        </span>
                        <span className="text-[10px] font-medium" style={{ color: group.color }}>
                          {group.name}
                        </span>
                        {addedIds.has(exercise.id) && (
                          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                            追加済み
                          </span>
                        )}
                      </div>
                      <p className="mt-1 truncate text-[11px] text-slate-400">
                        {exercise.hint || ' '}
                      </p>
                    </div>
                  </button>
                  {isSelected && (
                    <span className="pointer-events-none absolute left-2 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white shadow">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m5 12 5 5 9-10" />
                      </svg>
                    </span>
                  )}
                  <button
                    type="button"
                    aria-label={`${exercise.name}の詳細`}
                    onClick={() => setDetail(exercise)}
                    className="absolute right-2 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-xs font-bold italic text-slate-500 shadow"
                  >
                    i
                  </button>
                </li>
              )
            })}
            <li>
              <button
                type="button"
                onClick={() => setCreating(true)}
                className={`flex h-full min-h-40 w-full flex-col items-center justify-center rounded-xl border-2 border-dashed p-3 text-center text-sm font-semibold ${
                  list.length === 0 && searching
                    ? 'border-indigo-400 bg-indigo-50 text-indigo-600'
                    : 'border-slate-300 text-slate-500'
                }`}
              >
                <span className="text-2xl leading-none">＋</span>
                <span className="mt-1">新しい種目を作成</span>
              </button>
            </li>
          </ul>
        </div>
      </div>

      <footer className="safe-bottom border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-lg px-4 py-3">
          <button
            type="button"
            onClick={confirm}
            disabled={selected.length === 0}
            className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white disabled:bg-slate-200 disabled:text-slate-400"
          >
            {selected.length > 0 ? `${selected.length}種目を追加` : '種目を選んでください'}
          </button>
        </div>
      </footer>

      {detail && (
        <ExerciseDetailDialog
          exercise={detail}
          group={resolveGroup(groupMap, detail.bodyPart)}
          selected={selected.includes(detail.id)}
          onToggle={() => toggle(detail.id)}
          onClose={() => setDetail(null)}
        />
      )}

      {creating && (
        <CustomExerciseForm
          defaultName={query}
          onClose={() => setCreating(false)}
          onSaved={(exercise) => {
            setCreating(false)
            setQuery('')
            setTab('custom')
            setSelected((prev) => [...prev, exercise.id])
          }}
        />
      )}
    </div>
  )
}
