/**
 * タイマー作動中に画面が自動で消えないようにする（Screen Wake Lock API）。
 * 対応していない環境では何もしない。複数のタイマーが同時に使っても、全部止まるまで保持する。
 * 画面を切り替えると OS が解除するので、表示に戻ったら取り直す。
 */
type Sentinel = { release: () => Promise<void> }
type WakeLockApi = { request: (type: 'screen') => Promise<Sentinel> }

let holders = 0
let sentinel: Sentinel | null = null

function api(): WakeLockApi | null {
  return (navigator as unknown as { wakeLock?: WakeLockApi }).wakeLock ?? null
}

async function acquire(): Promise<void> {
  const wakeLock = api()
  if (!wakeLock || sentinel || holders === 0 || document.visibilityState !== 'visible') return
  try {
    sentinel = await wakeLock.request('screen')
    if (holders === 0) void releaseNow()
  } catch {
    // 省電力モードなどで拒否されることがある。タイマー自体は動くので無視する
  }
}

async function releaseNow(): Promise<void> {
  const current = sentinel
  sentinel = null
  try {
    await current?.release()
  } catch {
    // 解除済み
  }
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      sentinel = null // 裏に回ったときに OS が解除している
      void acquire()
    }
  })
}

/** 画面を点けたままにする。戻り値の関数で解除する */
export function keepScreenOn(): () => void {
  holders += 1
  void acquire()
  let released = false
  return () => {
    if (released) return
    released = true
    holders -= 1
    if (holders === 0) void releaseNow()
  }
}
