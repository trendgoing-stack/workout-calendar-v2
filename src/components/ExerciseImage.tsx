import { useState } from 'react'
import type { Exercise } from '../types'
import { withAlpha } from '../lib/colors'
import { BodyPartIcon } from './BodyPartIcon'

/**
 * 種目のイラスト（正方形）。
 * - SVG は CSS の mask で表示し、線の色を文字色（currentColor）に合わせる。
 *   <img> で表示すると SVG 内の currentColor が常に黒になり、ダークモードで見えなくなるため
 * - PNG / WebP はそのまま <img> で表示する
 * - image が無い、または読み込みに失敗したら部位アイコンを表示する
 */
export function ExerciseImage({
  exercise,
  color,
  className = '',
  iconClassName = 'h-1/2 w-1/2',
}: {
  exercise: Exercise
  /** 部位の色（背景と部位アイコンに使う） */
  color: string
  className?: string
  iconClassName?: string
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  const url = exercise.image ? `${import.meta.env.BASE_URL}${exercise.image}` : null
  const showImage = url !== null && failedUrl !== url
  const isSvg = url?.toLowerCase().endsWith('.svg') ?? false

  return (
    <div
      className={`relative flex aspect-square items-center justify-center overflow-hidden rounded-lg text-slate-700 ${className}`}
      style={{ backgroundColor: withAlpha(color, 0.1) }}
    >
      {showImage && isSvg && (
        <>
          {/* 読み込みの成否を知るためだけの非表示の img */}
          <img src={url} alt="" className="hidden" onError={() => setFailedUrl(url)} />
          <div
            className="absolute inset-[6%] bg-current"
            style={{
              maskImage: `url("${url}")`,
              WebkitMaskImage: `url("${url}")`,
              maskSize: 'contain',
              WebkitMaskSize: 'contain',
              maskRepeat: 'no-repeat',
              WebkitMaskRepeat: 'no-repeat',
              maskPosition: 'center',
              WebkitMaskPosition: 'center',
            }}
          />
        </>
      )}
      {showImage && !isSvg && (
        <img
          src={url}
          alt=""
          className="absolute inset-0 h-full w-full object-contain"
          onError={() => setFailedUrl(url)}
        />
      )}
      {!showImage && (
        <BodyPartIcon bodyPart={exercise.bodyPart} color={color} className={iconClassName} />
      )}
    </div>
  )
}
