import { APP_CONFIG } from '../config/app'

/**
 * localStorage への読み書きを担当する唯一のモジュール。
 * ほかのファイルから localStorage を直接触らないこと（.oxlintrc.json で禁止している）。
 *
 * Safari では同じ github.io ドメインの旧アプリと localStorage を共有するため、
 * - 書き込みは APP_CONFIG.storagePrefix で始まる、この β 版専用のキーにだけ行う
 * - 旧アプリのキー（APP_CONFIG.legacyStorageKey）は読み取り専用で、書き込み・削除はしない
 * 書き込み関数はキー名を外から受け取らないので、旧キーに書き込むことはできない。
 */

/** β 版が書き込むキー（プレフィックスの後ろの部分） */
type OwnKey = 'data' | 'backup-v1'

function ownKey(key: OwnKey): string {
  const full = `${APP_CONFIG.storagePrefix}${key}`
  // 設定ミスで旧キーと同じ名前になったら、書き込む前に止める
  if (full === APP_CONFIG.legacyStorageKey) {
    throw new Error(`旧アプリのキー（${full}）には書き込めません`)
  }
  return full
}

function storage(): Storage | null {
  try {
    return typeof window !== 'undefined' && window.localStorage ? window.localStorage : null
  } catch {
    return null
  }
}

/** 保存データ（JSON 文字列）を読む。無ければ null */
export function readDataRaw(): string | null {
  return storage()?.getItem(ownKey('data')) ?? null
}

/** 保存データを書き込む。容量超過などで失敗したら例外を投げる */
export function writeDataRaw(json: string): void {
  const s = storage()
  if (!s) return
  s.setItem(ownKey('data'), json)
}

export function removeData(): void {
  storage()?.removeItem(ownKey('data'))
}

/** 移行前の v1 データを保存する（1世代のみ。前回のものは上書き） */
export function writeBackupV1Raw(json: string): void {
  const s = storage()
  if (!s) return
  s.setItem(ownKey('backup-v1'), json)
}

export function readBackupV1Raw(): string | null {
  return storage()?.getItem(ownKey('backup-v1')) ?? null
}

/** 旧アプリのデータ（読み取り専用）。同じブラウザに無ければ null */
export function readLegacyRaw(): string | null {
  try {
    return storage()?.getItem(APP_CONFIG.legacyStorageKey) ?? null
  } catch {
    return null
  }
}
