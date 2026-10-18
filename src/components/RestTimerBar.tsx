import { useSyncExternalStore } from 'react'
import {
  addRestTime,
  getRestTimer,
  remainingSeconds,
  startRestTimer,
  stopRestTimer,
  subscribeRestTimer,
} from '../lib/restTimer'
import { formatSeconds } from '../lib/format'

const PRESETS = [60, 90, 120, 180]

const clock = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${`${seconds % 60}`.padStart(2, '0')}`

/** 記録入力画面の下に出す休憩タイマー（手動で開始） */
export function RestTimerBar() {
  const timer = useSyncExternalStore(subscribeRestTimer, getRestTimer)

  if (timer.status === 'idle') {
    return (
      <div className="flex items-center gap-1.5">
        <span className="shrink-0 text-xs font-medium text-slate-500">休憩</span>
        {PRESETS.map((seconds) => (
          <button
            key={seconds}
            type="button"
            onClick={() => startRestTimer(seconds)}
            className="flex-1 rounded-lg bg-slate-100 py-1.5 text-xs font-medium text-slate-600 active:bg-slate-200"
          >
            {formatSeconds(seconds)}
          </button>
        ))}
      </div>
    )
  }

  if (timer.status === 'finished') {
    return (
      <button
        type="button"
        onClick={stopRestTimer}
        className="flex w-full items-center justify-between rounded-lg bg-emerald-500 px-3 py-2 text-sm font-semibold text-white"
      >
        <span>休憩終了！次のセットへ</span>
        <span className="text-xs font-normal opacity-80">タップで閉じる</span>
      </button>
    )
  }

  const remaining = remainingSeconds(timer)
  const progress = timer.duration > 0 ? remaining / timer.duration : 0
  return (
    <div className="overflow-hidden rounded-lg bg-indigo-50">
      <div className="flex items-center gap-2 px-3 py-1.5">
        <span className="text-xs font-medium text-indigo-500">休憩中</span>
        <span
          className="flex-1 text-lg font-bold tabular-nums text-indigo-700"
          role="timer"
          aria-live="off"
        >
          {clock(remaining)}
        </span>
        <button
          type="button"
          onClick={() => addRestTime(-15)}
          className="rounded-md bg-white px-2 py-1 text-xs font-medium text-indigo-600"
        >
          −15秒
        </button>
        <button
          type="button"
          onClick={() => addRestTime(15)}
          className="rounded-md bg-white px-2 py-1 text-xs font-medium text-indigo-600"
        >
          ＋15秒
        </button>
        <button
          type="button"
          onClick={stopRestTimer}
          className="rounded-md bg-white px-2 py-1 text-xs font-medium text-slate-500"
        >
          停止
        </button>
      </div>
      <div className="h-1 bg-indigo-100">
        <div
          className="h-full bg-indigo-500 transition-[width] duration-200"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </div>
  )
}
