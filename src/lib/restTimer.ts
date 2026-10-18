import { beep, unlockAudio } from './sound'
import { keepScreenOn } from './wakeLock'

/**
 * 休憩タイマー（カウントダウン）。
 * 記録入力画面を閉じても動き続けるよう、画面の外（このモジュール）で状態を持つ。
 * 画面側は useSyncExternalStore で subscribeRestTimer / getRestTimer を購読する。
 *
 * 残り時間は終了時刻から計算するので、画面ロックなどで処理が止まっても、戻ったときに正しく表示される。
 */
export interface RestTimerState {
  /** 'idle' 未使用 / 'running' カウント中 / 'finished' 終了（閉じるまで表示） */
  status: 'idle' | 'running' | 'finished'
  /** 終了時刻（ミリ秒） */
  endAt: number
  /** 設定した長さ（秒）。進捗バーに使う */
  duration: number
  /** 表示を更新するための現在時刻 */
  now: number
}

let state: RestTimerState = { status: 'idle', endAt: 0, duration: 0, now: Date.now() }
const listeners = new Set<() => void>()
let interval: number | undefined
let releaseScreen: (() => void) | null = null

/** 終了に気づくのがこれより遅れたら（裏に回っていた場合など）音は鳴らさない */
const LATE_BEEP_LIMIT_MS = 60_000

function setState(next: RestTimerState): void {
  state = next
  listeners.forEach((listener) => listener())
}

function stopTicking(): void {
  window.clearInterval(interval)
  interval = undefined
  releaseScreen?.()
  releaseScreen = null
}

function tick(): void {
  const now = Date.now()
  if (state.status !== 'running') return
  if (now >= state.endAt) {
    stopTicking()
    if (now - state.endAt < LATE_BEEP_LIMIT_MS) beep(3)
    setState({ ...state, status: 'finished', now })
    return
  }
  setState({ ...state, now })
}

export function subscribeRestTimer(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getRestTimer(): RestTimerState {
  return state
}

/** 残り秒数（切り上げ） */
export function remainingSeconds(s: RestTimerState): number {
  return Math.max(0, Math.ceil((s.endAt - s.now) / 1000))
}

/** タップの処理の中で呼ぶこと（iOS で音を鳴らせるようにするため） */
export function startRestTimer(seconds: number): void {
  unlockAudio()
  const now = Date.now()
  setState({ status: 'running', endAt: now + seconds * 1000, duration: seconds, now })
  if (interval === undefined) interval = window.setInterval(tick, 250)
  releaseScreen ??= keepScreenOn()
}

/** 残り時間を増やす（減らすときは負の値） */
export function addRestTime(seconds: number): void {
  if (state.status !== 'running') return
  const endAt = Math.max(Date.now() + 1000, state.endAt + seconds * 1000)
  setState({ ...state, endAt, duration: Math.max(state.duration + seconds, 1), now: Date.now() })
}

/** 止める（または終了表示を閉じる） */
export function stopRestTimer(): void {
  stopTicking()
  setState({ status: 'idle', endAt: 0, duration: 0, now: Date.now() })
}

if (typeof document !== 'undefined') {
  // 画面に戻ったらすぐ残り時間を更新する
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') tick()
  })
}
