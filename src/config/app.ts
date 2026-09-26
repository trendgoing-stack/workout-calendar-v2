/**
 * リポジトリ（公開先）ごとに変わる値をここに集約する。
 * ほかのファイルにはこれらの値を直書きしないこと。
 *
 * vite.config.ts からも読み込むので、ブラウザ専用の API（import.meta.env など）は使わない。
 *
 * 将来、既存リポジトリ（workout-calendar）へ統合するときは、
 * ここの値を既存のものに戻す（README の「将来の統合」を参照）。
 */
export const APP_CONFIG = {
  /** GitHub のリポジトリ名 */
  repoName: 'workout-calendar-v2',
  /** 公開パス（Vite の base、manifest の start_url / scope） */
  basePath: '/workout-calendar-v2/',
  /** アプリ名（manifest の name、<title>） */
  appName: '筋トレカレンダー β',
  /** ホーム画面に表示される短い名前 */
  shortName: '筋トレβ',
  description: 'トレーニングをカレンダーで記録・振り返りするアプリ（β版）',
  /** manifest の id。既存版と別アプリとして扱われるよう、既存と異なる値にする */
  manifestId: '/workout-calendar-v2/?app=beta',
  /** localStorage のキーのプレフィックス。書き込みはこのプレフィックスのキーにだけ行う */
  storagePrefix: 'workout-calendar-beta:',
  /** 旧アプリ（既存版）の localStorage キー。読み取り専用 */
  legacyStorageKey: 'workout-calendar:data',
  /** Service Worker のキャッシュ名のプレフィックス（既存版のキャッシュを消さないよう別の値にする） */
  cachePrefix: 'workout-calendar-beta-',
  /** エクスポートする JSON の app 欄とファイル名 */
  exportAppId: 'workout-calendar-beta',
} as const
