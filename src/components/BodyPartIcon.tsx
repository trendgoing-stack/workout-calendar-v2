/**
 * 部位アイコン。イラストが無い（または読み込めない）種目の代わりに表示する。
 * 部位ごとの単純な図形を、部位の色で塗る。未知の部位（ユーザーが追加した部位など）はダンベル。
 */
const PATHS: Record<string, string> = {
  // 胸：左右の大胸筋
  chest:
    'M3.5 7.5C5.5 5.5 9 5.2 11.2 6.4V15c-3.2 1-6.4.2-7.9-2.4-.6-1.1-.5-3.5.2-5.1Z' +
    'M20.5 7.5C18.5 5.5 15 5.2 12.8 6.4V15c3.2 1 6.4.2 7.9-2.4.6-1.1.5-3.5-.2-5.1Z',
  // 背中：逆三角形の背中
  back: 'M4 4.5h16l-2.2 7.8L12 20l-5.8-7.7Z',
  // 肩：丸い三角筋
  shoulder: 'M3 15.5C3 10 7 6 12 6s9 4 9 9.5V17H3Z',
  // 腕：力こぶ
  arm: 'M4 19c.3-4.2 1.8-7.6 4.6-9.8L11 4.5l3.4 1.3-1.6 4.4c3.6-.6 6.7 1.3 7.2 4.7L20 19Z',
  // 腹筋：6つに割れた腹筋
  abs:
    'M7 4h4.3v4.3H7Z M12.7 4H17v4.3h-4.3Z M7 9.8h4.3v4.3H7Z M12.7 9.8H17v4.3h-4.3Z' +
    'M7 15.6h4.3V20H8.5A1.5 1.5 0 0 1 7 18.5Z M12.7 15.6H17v2.9a1.5 1.5 0 0 1-1.5 1.5h-2.8Z',
  // 脚：脚の形
  leg: 'M8.5 2.5h7l-1.3 9.5.8 7h3.5V21H9.8l.7-9Z',
  // 有酸素：ハート
  cardio:
    'M12 20.5s-8.5-5.2-8.5-11.2A4.7 4.7 0 0 1 12 6.6a4.7 4.7 0 0 1 8.5 2.7c0 6-8.5 11.2-8.5 11.2Z',
}

const DUMBBELL = 'M3 9.5h2v5H3Z M5.5 7h3v10h-3Z M8.5 11h7v2h-7Z M15.5 7h3v10h-3Z M19 9.5h2v5h-2Z'

export function BodyPartIcon({
  bodyPart,
  color,
  className = 'h-6 w-6',
}: {
  bodyPart: string
  color: string
  className?: string
}) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d={PATHS[bodyPart] ?? DUMBBELL} fill={color} />
    </svg>
  )
}
