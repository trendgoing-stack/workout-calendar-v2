/**
 * アプリ全体のデータ型定義（スキーマ v2）。
 * localStorage に保存されるスキーマそのものなので、変更する場合は
 * src/lib/normalize.ts（検証）と src/lib/migrate.ts（旧形式からの移行）も合わせて更新すること。
 * 旧形式（v1）の型は ./v1.ts にある。
 */

/** 'YYYY-MM-DD' 形式のローカル日付 */
export type ISODate = string

/** ISO 8601 のタイムスタンプ（例: '2026-09-09T12:34:56.789Z'） */
export type Timestamp = string

/** 部位タグ（胸・背中 など）。ユーザーが追加・色変更できる */
export interface MuscleGroup {
  id: string
  name: string
  /** #rrggbb 形式のカラーコード */
  color: string
  /** 表示順（小さいほど先） */
  order: number
}

/**
 * 記録タイプ
 * - weightReps: 重量 × 回数
 * - reps: 回数のみ（加重可の種目は重量も記録できる）
 * - time: 秒数のみ
 */
export type RecordType = 'weightReps' | 'reps' | 'time'

/** 種目（マスタ種目とカスタム種目で共通の形） */
export interface Exercise {
  /** 英小文字とハイフン（カスタム種目は custom-<ランダム文字列>）。一度決めたら変更しない */
  id: string
  /** 表示名 */
  name: string
  /** 検索用のひらがな読み */
  kana: string
  /** 別名（移行時の名前照合と検索に使う） */
  aliases: string[]
  /** 部位（MuscleGroup.id） */
  bodyPart: string
  recordType: RecordType
  /** 自重種目で加重を記録できるか */
  allowOptionalWeight: boolean
  /** 片側ずつ行う種目か（回数は片側の回数を記録する） */
  unilateral: boolean
  /** 一言説明（60文字以内） */
  hint: string
  /** 例: 'exercises/push-up.svg'（公開パスからの相対）。無ければ部位アイコンを表示する */
  image?: string
  /** 部位内の表示順 */
  order: number
  /** マスタは true、カスタム種目は false */
  builtIn: boolean
  /** カスタム種目の非表示フラグ（記録で使用中のカスタム種目を削除したとき） */
  archived?: boolean
}

/** 1セット分の記録。記録タイプに応じて必要な値だけを持つ */
export interface SetEntry {
  id: string
  /** 回数（1〜999 の整数） */
  reps?: number
  /** 重量（設定の単位。kg なら 0.5〜300、lb なら 1〜660。0.5 刻み） */
  weight?: number
  /** 秒数（1〜3600 の整数） */
  seconds?: number
}

/** セッション内の1種目 */
export interface SessionExercise {
  id: string
  exerciseId: string
  /** 記録時点の種目名（種目が見つからないときの表示に使う） */
  nameSnapshot: string
  recordTypeSnapshot: RecordType
  /** 鍛えた部位（MuscleGroup.id の配列・複数選択可）。頻度グラフの集計に使う */
  muscleGroupIds: string[]
  /** 自重種目で加重したか */
  weighted?: boolean
  sets: SetEntry[]
  /** 種目ごとのメモ */
  memo?: string
}

/** 1レコード = 1日のトレーニングセッション */
export interface WorkoutSession {
  id: string
  date: ISODate
  exercises: SessionExercise[]
  /** セッション全体のメモ */
  memo: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

/** ルーティン（テンプレート）に登録する種目。セットの値は未定なら空 */
export type RoutineExercise = SessionExercise

/** よく行う種目の組み合わせ */
export interface Routine {
  id: string
  name: string
  description: string
  exercises: RoutineExercise[]
  createdAt: Timestamp
  updatedAt: Timestamp
}

export type WeightUnit = 'kg' | 'lb'

/** 0 = 日曜始まり, 1 = 月曜始まり */
export type WeekStart = 0 | 1

export interface Settings {
  muscleGroups: MuscleGroup[]
  weightUnit: WeightUnit
  weekStartsOn: WeekStart
}

/** localStorage に入る最上位のオブジェクト */
export interface AppData {
  /** スキーマバージョン。無い（または 2 以外の）データは v1 として扱う */
  schemaVersion: 2
  sessions: WorkoutSession[]
  routines: Routine[]
  /** ユーザーが追加した種目（マスタ種目は src/data/exercises.ts） */
  customExercises: Exercise[]
  settings: Settings
}

/** エクスポート／インポートで受け渡す JSON の形 */
export interface ExportFile extends AppData {
  exportedAt: Timestamp
  app: string
}
