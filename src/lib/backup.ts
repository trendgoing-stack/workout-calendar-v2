import type { AppData, ExportFile } from '../types'
import { APP_CONFIG } from '../config/app'
import { todayISO } from './date'
import { nowIso } from './id'

/** エクスポート用の JSON を組み立てる */
export function buildExportFile(data: AppData): ExportFile {
  return { ...data, app: APP_CONFIG.exportAppId, exportedAt: nowIso() }
}

/** 文字列を JSON ファイルとしてダウンロードさせる */
export function downloadText(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  // 少し待ってから解放する（Safari 対策）
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** 現在のデータを JSON ファイルとしてダウンロードさせる */
export function downloadJson(data: AppData): void {
  downloadText(
    JSON.stringify(buildExportFile(data), null, 2),
    `${APP_CONFIG.exportAppId}-${todayISO()}.json`,
  )
}

/** 移行に失敗した元データをそのままダウンロードさせる */
export function downloadRawBackup(raw: string): void {
  downloadText(raw, `${APP_CONFIG.exportAppId}-original-${todayISO()}.json`)
}
