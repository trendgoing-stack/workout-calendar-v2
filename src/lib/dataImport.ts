import type { AppData } from '../types'
import type { MigrationReport } from './migrate'
import { migrateV1ToV2 } from './migrate'
import {
  createEmptyAppData,
  isObject,
  isV2Data,
  looksLikeAppData,
  normalizeAppData,
  normalizeV1AppData,
} from './normalize'
import { readDataRaw, writeBackupV1Raw, writeDataRaw } from './storage'

/**
 * 外から来たデータ（インポートした JSON・旧アプリのデータ・起動時の保存データ）を
 * v2 の AppData にする。ここでは何も書き込まない。
 */
export type DataPlan =
  | {
      ok: true
      data: AppData
      /** v1 から移行した場合の元データ（backup-v1 に保存する）と結果 */
      migratedFrom?: { raw: string; report: MigrationReport }
    }
  | {
      ok: false
      error: string
      /** 元データ（「元データをエクスポート」用） */
      raw: string
    }

export function planFromJson(raw: string): DataPlan {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { ok: false, error: 'JSON として読み込めませんでした', raw }
  }
  if (!looksLikeAppData(parsed) || !isObject(parsed)) {
    return { ok: false, error: 'このアプリのデータではないようです（形式が正しくありません）', raw }
  }
  if (isV2Data(parsed)) {
    return { ok: true, data: normalizeAppData(parsed) }
  }
  try {
    const { data, report } = migrateV1ToV2(normalizeV1AppData(parsed))
    return { ok: true, data, migratedFrom: { raw, report } }
  } catch (error) {
    return {
      ok: false,
      error: `旧形式のデータの移行に失敗しました: ${error instanceof Error ? error.message : String(error)}`,
      raw,
    }
  }
}

/**
 * 計画どおりに保存する。v1 からの移行なら、先に元データを backup-v1 に保存する（1世代のみ）。
 * 保存に失敗したら例外を投げる。
 */
export function commitPlan(plan: Extract<DataPlan, { ok: true }>): AppData {
  if (plan.migratedFrom) writeBackupV1Raw(plan.migratedFrom.raw)
  writeDataRaw(JSON.stringify(plan.data))
  return plan.data
}

export type BootResult =
  | { ok: true; data: AppData; report?: MigrationReport }
  | { ok: false; error: string; raw: string }

/**
 * 起動時の読み込み（画面を描画する前に同期で行う）。
 * 1. 保存データが無ければ空のデータで始める（旧アプリのデータは自動では取り込まない）
 * 2. v2 ならそのまま使う
 * 3. v2 でなければ移行して保存する。失敗したら何も書き込まずにエラーを返す
 */
export function bootLoad(): BootResult {
  let raw: string | null
  try {
    raw = readDataRaw()
  } catch {
    return { ok: true, data: createEmptyAppData() }
  }
  if (!raw) return { ok: true, data: createEmptyAppData() }

  const plan = planFromJson(raw)
  if (!plan.ok) return plan
  if (!plan.migratedFrom) return { ok: true, data: plan.data }
  try {
    return { ok: true, data: commitPlan(plan), report: plan.migratedFrom.report }
  } catch {
    return { ok: false, error: '移行したデータを保存できませんでした（空き容量をご確認ください）', raw }
  }
}
