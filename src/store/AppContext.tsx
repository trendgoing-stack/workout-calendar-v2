import { useCallback, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { AppData, Exercise, Routine, Settings, WorkoutSession } from '../types'
import { repository } from '../lib/repository'
import { createSampleData } from '../lib/normalize'
import { commitPlan } from '../lib/dataImport'
import type { DataPlan } from '../lib/dataImport'
import { buildCatalog, exerciseMap } from '../lib/exerciseCatalog'
import { groupSessionsByDate, muscleGroupMap } from '../lib/selectors'
import { AppContext } from './context'
import type { AppContextValue } from './context'

/**
 * @param initialData 起動時に（画面を描画する前に）読み込んだデータ。src/main.tsx を参照
 */
export function AppProvider({
  initialData,
  children,
}: {
  initialData: AppData
  children: ReactNode
}) {
  const [data, setData] = useState<AppData>(initialData)
  const [error, setError] = useState<string | null>(null)

  /** repository 呼び出しの共通ラッパー（結果を state に反映し、失敗はメッセージ化する） */
  const run = useCallback(async (task: () => Promise<AppData>) => {
    try {
      const next = await task()
      setData(next)
      setError(null)
      return true
    } catch (e) {
      console.error(e)
      setError('保存に失敗しました。空き容量をご確認ください。')
      return false
    }
  }, [])

  const saveSession = useCallback(
    async (session: WorkoutSession) => void (await run(() => repository.saveSession(session))),
    [run],
  )
  const saveSessions = useCallback(
    async (sessions: WorkoutSession[]) =>
      void (await run(() => repository.saveSessions(sessions))),
    [run],
  )
  const deleteSession = useCallback(
    async (sessionId: string) => void (await run(() => repository.deleteSession(sessionId))),
    [run],
  )
  const saveRoutine = useCallback(
    async (routine: Routine) => void (await run(() => repository.saveRoutine(routine))),
    [run],
  )
  const deleteRoutine = useCallback(
    async (routineId: string) => void (await run(() => repository.deleteRoutine(routineId))),
    [run],
  )
  const saveCustomExercise = useCallback(
    async (exercise: Exercise) =>
      void (await run(() => repository.saveCustomExercise(exercise))),
    [run],
  )
  const deleteCustomExercise = useCallback(
    async (exerciseId: string) =>
      void (await run(() => repository.deleteCustomExercise(exerciseId))),
    [run],
  )
  const updateSettings = useCallback(
    async (patch: Partial<Settings>) => void (await run(() => repository.updateSettings(patch))),
    [run],
  )
  const applyPlan = useCallback(
    (plan: Extract<DataPlan, { ok: true }>) => run(async () => commitPlan(plan)),
    [run],
  )
  const clearAll = useCallback(async () => void (await run(() => repository.clearAll())), [run])

  const loadSampleData = useCallback(
    async () =>
      void (await run(async () => {
        const current = await repository.getAll()
        const sample = createSampleData()
        return repository.replaceAll({
          ...current,
          sessions: [...sample.sessions, ...current.sessions],
          routines: [...current.routines, ...sample.routines],
        })
      })),
    [run],
  )

  const muscleGroups = useMemo(
    () => [...data.settings.muscleGroups].sort((a, b) => a.order - b.order),
    [data.settings.muscleGroups],
  )
  const groupMap = useMemo(() => muscleGroupMap(muscleGroups), [muscleGroups])
  const sessionsByDate = useMemo(() => groupSessionsByDate(data.sessions), [data.sessions])
  const catalog = useMemo(() => buildCatalog(data.customExercises), [data.customExercises])
  const exerciseById = useMemo(() => exerciseMap(catalog), [catalog])

  const value = useMemo<AppContextValue>(
    () => ({
      data,
      error,
      sessions: data.sessions,
      routines: data.routines,
      settings: data.settings,
      muscleGroups,
      groupMap,
      sessionsByDate,
      catalog,
      exerciseById,
      saveSession,
      saveSessions,
      deleteSession,
      saveRoutine,
      deleteRoutine,
      saveCustomExercise,
      deleteCustomExercise,
      updateSettings,
      applyPlan,
      clearAll,
      loadSampleData,
      dismissError: () => setError(null),
    }),
    [
      data,
      error,
      muscleGroups,
      groupMap,
      sessionsByDate,
      catalog,
      exerciseById,
      saveSession,
      saveSessions,
      deleteSession,
      saveRoutine,
      deleteRoutine,
      saveCustomExercise,
      deleteCustomExercise,
      updateSettings,
      applyPlan,
      clearAll,
      loadSampleData,
    ],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
