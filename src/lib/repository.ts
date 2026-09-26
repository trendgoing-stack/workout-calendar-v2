import type { AppData, Exercise, Routine, Settings, WorkoutSession } from '../types'
import { nowIso } from './id'
import { createEmptyAppData, normalizeAppData } from './normalize'
import { readDataRaw, removeData, writeDataRaw } from './storage'

/**
 * データ操作の窓口。
 * UI 側はこの interface だけを使うので、将来 Supabase などに移行するときは
 * SupabaseRepository を実装して `repository` を差し替えるだけで済む。
 * （そのため戻り値はすべて Promise にしてある）
 */
export interface WorkoutRepository {
  getAll(): Promise<AppData>
  /** セッションを新規追加または更新して、更新後の全データを返す */
  saveSession(session: WorkoutSession): Promise<AppData>
  saveSessions(sessions: WorkoutSession[]): Promise<AppData>
  deleteSession(sessionId: string): Promise<AppData>
  saveRoutine(routine: Routine): Promise<AppData>
  deleteRoutine(routineId: string): Promise<AppData>
  /** カスタム種目を新規追加または更新する */
  saveCustomExercise(exercise: Exercise): Promise<AppData>
  /** カスタム種目を削除する。記録・ルーティンで使用中なら非表示（archived）にする */
  deleteCustomExercise(exerciseId: string): Promise<AppData>
  updateSettings(patch: Partial<Settings>): Promise<AppData>
  /** インポート用。全データを置き換える */
  replaceAll(data: AppData): Promise<AppData>
  clearAll(): Promise<AppData>
}

const sortSessions = (sessions: WorkoutSession[]): WorkoutSession[] =>
  [...sessions].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))

function upsertSession(sessions: WorkoutSession[], session: WorkoutSession): WorkoutSession[] {
  const next = { ...session, updatedAt: nowIso() }
  const index = sessions.findIndex((s) => s.id === session.id)
  if (index === -1) return sortSessions([next, ...sessions])
  const copy = [...sessions]
  copy[index] = next
  return sortSessions(copy)
}

/** その種目が記録またはルーティンで使われているか */
export function isExerciseInUse(data: AppData, exerciseId: string): boolean {
  const uses = (list: Array<{ exercises: Array<{ exerciseId: string }> }>) =>
    list.some((item) => item.exercises.some((e) => e.exerciseId === exerciseId))
  return uses(data.sessions) || uses(data.routines)
}

class LocalStorageRepository implements WorkoutRepository {
  private commit(data: AppData): AppData {
    writeDataRaw(JSON.stringify(data))
    return data
  }

  private read(): AppData {
    const raw = readDataRaw()
    return raw ? normalizeAppData(JSON.parse(raw)) : createEmptyAppData()
  }

  async getAll(): Promise<AppData> {
    return this.read()
  }

  async saveSession(session: WorkoutSession): Promise<AppData> {
    const data = this.read()
    return this.commit({ ...data, sessions: upsertSession(data.sessions, session) })
  }

  async saveSessions(sessions: WorkoutSession[]): Promise<AppData> {
    const data = this.read()
    const merged = sessions.reduce(upsertSession, data.sessions)
    return this.commit({ ...data, sessions: merged })
  }

  async deleteSession(sessionId: string): Promise<AppData> {
    const data = this.read()
    return this.commit({
      ...data,
      sessions: data.sessions.filter((s) => s.id !== sessionId),
    })
  }

  async saveRoutine(routine: Routine): Promise<AppData> {
    const data = this.read()
    const next = { ...routine, updatedAt: nowIso() }
    const index = data.routines.findIndex((r) => r.id === routine.id)
    const routines =
      index === -1
        ? [...data.routines, next]
        : data.routines.map((r) => (r.id === routine.id ? next : r))
    return this.commit({ ...data, routines })
  }

  async deleteRoutine(routineId: string): Promise<AppData> {
    const data = this.read()
    return this.commit({
      ...data,
      routines: data.routines.filter((r) => r.id !== routineId),
    })
  }

  async saveCustomExercise(exercise: Exercise): Promise<AppData> {
    const data = this.read()
    const index = data.customExercises.findIndex((e) => e.id === exercise.id)
    const customExercises =
      index === -1
        ? [...data.customExercises, { ...exercise, order: data.customExercises.length }]
        : data.customExercises.map((e) => (e.id === exercise.id ? exercise : e))
    return this.commit({ ...data, customExercises })
  }

  async deleteCustomExercise(exerciseId: string): Promise<AppData> {
    const data = this.read()
    const customExercises = isExerciseInUse(data, exerciseId)
      ? data.customExercises.map((e) => (e.id === exerciseId ? { ...e, archived: true } : e))
      : data.customExercises.filter((e) => e.id !== exerciseId)
    return this.commit({ ...data, customExercises })
  }

  async updateSettings(patch: Partial<Settings>): Promise<AppData> {
    const data = this.read()
    return this.commit({ ...data, settings: { ...data.settings, ...patch } })
  }

  async replaceAll(data: AppData): Promise<AppData> {
    return this.commit(normalizeAppData(data))
  }

  async clearAll(): Promise<AppData> {
    removeData()
    return this.read()
  }
}

export const repository: WorkoutRepository = new LocalStorageRepository()
