/**
 * タイマーの合図音（Web Audio で短いビープを鳴らす。音声ファイルは使わない）。
 *
 * iOS Safari では、ユーザーのタップの中で一度 AudioContext を作って再生可能にしておかないと
 * 後から音を鳴らせない。タイマーの開始ボタンで unlockAudio() を呼ぶこと。
 * 画面ロック中やアプリが裏にある間は鳴らない（ブラウザの制約）。
 */
let context: AudioContext | null = null

function getContext(): AudioContext | null {
  if (context) return context
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  context = new Ctor()
  return context
}

/** タップの処理の中で呼ぶ。以後 beep() で音を鳴らせるようにする */
export function unlockAudio(): void {
  const ctx = getContext()
  if (!ctx) return
  if (ctx.state === 'suspended') void ctx.resume()
  // 無音を一瞬鳴らして、iOS で再生を許可させる
  const gain = ctx.createGain()
  gain.gain.value = 0
  const osc = ctx.createOscillator()
  osc.connect(gain).connect(ctx.destination)
  osc.start()
  osc.stop(ctx.currentTime + 0.01)
}

/** 短いビープを times 回鳴らす */
export function beep(times = 3): void {
  const ctx = getContext()
  if (!ctx) return
  if (ctx.state === 'suspended') void ctx.resume()
  const start = ctx.currentTime + 0.05
  for (let i = 0; i < times; i++) {
    const t = start + i * 0.35
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.exponentialRampToValueAtTime(0.4, t + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.22)
    osc.connect(gain).connect(ctx.destination)
    osc.start(t)
    osc.stop(t + 0.25)
  }
}
