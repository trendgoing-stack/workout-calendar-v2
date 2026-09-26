import { useEffect } from 'react'

/**
 * モーダル表示中に背面（body）のスクロールを止める。
 * iOS Safari では overflow: hidden だけでは止まらないため、body を position: fixed にして
 * 現在のスクロール位置を保ったまま固定し、閉じたときに元の位置へ戻す。
 * 複数のモーダルが重なっても、最後の1つが閉じるまで固定を続ける。
 */
let lockCount = 0
let saved: { scrollY: number; cssText: string } | null = null

export function useScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active) return
    const body = document.body
    if (lockCount === 0) {
      saved = { scrollY: window.scrollY, cssText: body.style.cssText }
      body.style.position = 'fixed'
      body.style.top = `-${saved.scrollY}px`
      body.style.left = '0'
      body.style.right = '0'
      body.style.overflow = 'hidden'
    }
    lockCount += 1
    return () => {
      lockCount -= 1
      if (lockCount === 0 && saved) {
        body.style.cssText = saved.cssText
        window.scrollTo(0, saved.scrollY)
        saved = null
      }
    }
  }, [active])
}
