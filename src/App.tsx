import { useState } from 'react'
import { AppProvider } from './store/AppContext'
import { useApp } from './store/useApp'
import { TabBar } from './components/TabBar'
import { UpdateBanner } from './components/UpdateBanner'
import type { TabKey } from './components/TabBar'
import { CalendarPage } from './pages/CalendarPage'
import { StatsPage } from './pages/StatsPage'
import { RoutinesPage } from './pages/RoutinesPage'
import { SettingsPage } from './pages/SettingsPage'
import type { BootResult } from './lib/dataImport'
import type { MigrationReport } from './lib/migrate'
import { downloadRawBackup } from './lib/backup'
import { MigrationResultDialog } from './components/MigrationDialogs'

function Shell({ initialReport }: { initialReport?: MigrationReport }) {
  const [tab, setTab] = useState<TabKey>('calendar')
  const [report, setReport] = useState(initialReport ?? null)
  const { error, dismissError } = useApp()

  return (
    <div className="min-h-dvh pb-20">
      <UpdateBanner />
      <main className="mx-auto max-w-lg">
        {tab === 'calendar' && <CalendarPage />}
        {tab === 'stats' && <StatsPage />}
        {tab === 'routines' && <RoutinesPage />}
        {tab === 'settings' && <SettingsPage />}
      </main>

      {error && (
        <div className="fixed inset-x-0 bottom-20 z-40 mx-auto max-w-sm px-4">
          <button
            type="button"
            onClick={dismissError}
            className="w-full rounded-xl bg-red-500 px-4 py-3 text-left text-sm text-white shadow-lg"
          >
            {error}
            <span className="ml-2 opacity-70">（タップで閉じる）</span>
          </button>
        </div>
      )}

      {report && <MigrationResultDialog report={report} onClose={() => setReport(null)} />}

      <TabBar active={tab} onChange={setTab} />
    </div>
  )
}

/**
 * 保存データを読み込めなかった（移行に失敗した）ときの画面。
 * 何も書き込まずに止め、元データをエクスポートできるようにする。
 */
function BootError({ error, raw }: { error: string; raw: string }) {
  return (
    <div className="safe-top mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-6">
      <h1 className="text-lg font-bold text-slate-800">データを読み込めませんでした</h1>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{error}</p>
      <p className="mt-2 text-xs leading-relaxed text-slate-500">
        保存データは変更していません。元のデータをファイルとして保存し、
        アプリを更新してから設定画面の「インポート」で読み込み直してください。
      </p>
      <button
        type="button"
        onClick={() => downloadRawBackup(raw)}
        className="mt-5 w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white"
      >
        元データをエクスポート
      </button>
    </div>
  )
}

export default function App({ boot }: { boot: BootResult }) {
  if (!boot.ok) return <BootError error={boot.error} raw={boot.raw} />
  return (
    <AppProvider initialData={boot.data}>
      <Shell initialReport={boot.report} />
    </AppProvider>
  )
}
