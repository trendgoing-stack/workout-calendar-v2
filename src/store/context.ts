import { createContext } from 'react'
import type {
  AppData,
  Exercise,
  ISODate,
  MuscleGroup,
  Routine,
  Settings,
  WorkoutSession,
} from '../types'
import type { DataPlan } from '../lib/dataImport'

export interface AppContextValue {
  data: AppData
  /** 保存エラーなどの一時メッセージ */
  error: string | null
  sessions: WorkoutSession[]
  routines: Routine[]
  settings: Settings
  muscleGroups: MuscleGroup[]
  groupMap: Map<string, MuscleGroup>
  sessionsByDate: Map<ISODate, WorkoutSession[]>
  /** マスタ種目＋カスタム種目（アーカイブ済みも含む） */
  catalog: Exercise[]
  exerciseById: Map<string, Exercise>
  saveSession: (session: WorkoutSession) => Promise<void>
  saveSessions: (sessions: WorkoutSession[]) => Promise<void>
  deleteSession: (sessionId: string) => Promise<void>
  saveRoutine: (routine: Routine) => Promise<void>
  deleteRoutine: (routineId: string) => Promise<void>
  saveCustomExercise: (exercise: Exercise) => Promise<void>
  deleteCustomExercise: (exerciseId: string) => Promise<void>
  updateSettings: (patch: Partial<Settings>) => Promise<void>
  /** インポート（または旧アプリのデータの取り込み）を実行する。成功したら true */
  applyPlan: (plan: Extract<DataPlan, { ok: true }>) => Promise<boolean>
  clearAll: () => Promise<void>
  loadSampleData: () => Promise<void>
  dismissError: () => void
}

export const AppContext = createContext<AppContextValue | null>(null)
