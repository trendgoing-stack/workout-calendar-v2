/**
 * 旧形式（スキーマ v1）の型。既存版アプリのデータと、そのエクスポート JSON の形。
 * 移行処理（src/lib/migrate.ts）でだけ使う。
 */
import type { ISODate, Settings, Timestamp } from './index'

export interface V1Set {
  weight: number | null
  reps: number | null
}

export interface V1Exercise {
  /** 種目名（自由入力） */
  name: string
  muscleGroupIds: string[]
  sets: V1Set[]
  memo: string
}

export interface V1Session {
  id: string
  date: ISODate
  exercises: V1Exercise[]
  memo: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface V1Routine {
  id: string
  name: string
  description: string
  exercises: V1Exercise[]
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface V1AppData {
  sessions: V1Session[]
  routines: V1Routine[]
  settings: Settings
}
