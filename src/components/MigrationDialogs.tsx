import type { ReactNode } from 'react'
import type { MigrationReport } from '../lib/migrate'
import { downloadRawBackup } from '../lib/backup'

function DialogFrame({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-6">
      <button
        type="button"
        aria-label="閉じる"
        className="absolute inset-0 bg-slate-900/40"
        onClick={onClose}
      />
      <div
        role="dialog"
        className="relative flex max-h-[80dvh] w-full max-w-sm flex-col rounded-2xl bg-white p-5 shadow-xl"
      >
        {children}
      </div>
    </div>
  )
}

/** 旧形式（v1）からの移行結果 */
export function MigrationResultDialog({
  report,
  onClose,
}: {
  report: MigrationReport
  onClose: () => void
}) {
  const linkedCount = new Set(report.linked.map((l) => l.to)).size
  return (
    <DialogFrame onClose={onClose}>
      <h3 className="text-base font-semibold text-slate-800">旧形式のデータを取り込みました</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        {linkedCount}種目をマスタに紐付け、{report.created.length}
        種目をカスタム種目として登録しました。
      </p>
      <div className="mt-3 flex-1 space-y-3 overflow-y-auto text-xs text-slate-500">
        {report.linked.length > 0 && (
          <div>
            <div className="mb-1 font-medium text-slate-600">マスタに紐付けた種目</div>
            <ul className="space-y-0.5">
              {report.linked.map((l) => (
                <li key={l.from}>
                  {l.from === l.to ? l.to : `${l.from} → ${l.to}`}
                </li>
              ))}
            </ul>
          </div>
        )}
        {report.created.length > 0 && (
          <div>
            <div className="mb-1 font-medium text-slate-600">カスタム種目として登録した種目</div>
            <ul className="space-y-0.5">
              {report.created.map((name) => (
                <li key={name}>{name}</li>
              ))}
            </ul>
            <p className="mt-1.5">
              名前・部位・記録タイプは、設定画面の「カスタム種目の管理」から編集できます。
            </p>
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={onClose}
        className="mt-4 w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white"
      >
        OK
      </button>
    </DialogFrame>
  )
}

/** 読み込み・移行の失敗。何も書き込んでいないことと、元データのエクスポート手段を示す */
export function DataErrorDialog({
  error,
  raw,
  onClose,
}: {
  error: string
  raw: string
  onClose: () => void
}) {
  return (
    <DialogFrame onClose={onClose}>
      <h3 className="text-base font-semibold text-slate-800">データを取り込めませんでした</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{error}</p>
      <p className="mt-2 text-xs leading-relaxed text-slate-500">
        現在のデータは変更していません。元のデータをファイルとして保存しておけます。
      </p>
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-xl bg-slate-100 py-2.5 text-sm font-medium text-slate-600"
        >
          閉じる
        </button>
        <button
          type="button"
          onClick={() => downloadRawBackup(raw)}
          className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white"
        >
          元データをエクスポート
        </button>
      </div>
    </DialogFrame>
  )
}
