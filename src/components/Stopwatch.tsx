import { useEffect, useState } from 'react'
import { keepScreenOn } from '../lib/wakeLock'

const clock = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${`${seconds % 60}`.padStart(2, '0')}`

/**
 * 秒数の種目（プランクなど）用のストップウォッチ。
 * 「停止して記録」で計った秒数を onRecord に渡す（1秒未満は記録しない）。
 * 経過時間は開始時刻から計算するので、画面ロックなどで処理が止まっても正しく測れる。
 */
export function Stopwatch({ onRecord }: { onRecord: (seconds: number) => void }) {
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (startedAt === null) return
    const release = keepScreenOn()
    const update = () => setNow(Date.now())
    const interval = window.setInterval(update, 200)
    document.addEventListener('visibilitychange', update)
    return () => {
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', update)
      release()
    }
  }, [startedAt])

  const elapsed = startedAt === null ? 0 : Math.max(0, Math.floor((now - startedAt) / 1000))

  if (startedAt === null) {
    return (
      <button
        type="button"
        onClick={() => {
          const t = Date.now()
          setNow(t)
          setStartedAt(t)
        }}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-white py-2 text-sm font-medium text-indigo-600"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <circle cx="12" cy="13" r="8" />
          <path d="M12 9v4l2.5 2M10 2h4" />
        </svg>
        ストップウォッチで計る
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2 rounded-lg bg-indigo-50 px-3 py-1.5">
      <span className="text-xs font-medium text-indigo-500">計測中</span>
      <span className="flex-1 text-lg font-bold tabular-nums text-indigo-700" role="timer">
        {clock(elapsed)}
      </span>
      <button
        type="button"
        onClick={() => setStartedAt(null)}
        className="rounded-md bg-white px-2 py-1 text-xs font-medium text-slate-500"
      >
        取消
      </button>
      <button
        type="button"
        onClick={() => {
          const seconds = Math.floor((Date.now() - startedAt) / 1000)
          setStartedAt(null)
          if (seconds >= 1) onRecord(Math.min(seconds, 3600))
        }}
        className="rounded-md bg-indigo-600 px-2.5 py-1 text-xs font-semibold text-white"
      >
        停止して記録
      </button>
    </div>
  )
}
