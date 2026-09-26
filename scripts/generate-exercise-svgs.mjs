/**
 * 種目イラスト（public/exercises/<id>.svg）を生成するスクリプト。外部ライブラリは使わない。
 *   node scripts/generate-exercise-svgs.mjs
 *
 * 描き方の決まり：
 * - viewBox="0 0 200 200"、背景は透明、線画は stroke="currentColor"
 * - 人物は棒人間（頭は円、胴・腕・脚は太さ6の線）。床は y=172
 * - 器具（ダンベル・椅子・床・ローラー）は最小限の図形
 * - 動作の特徴が出る1ポーズを描き、動く方向を矢印1本で示す（矢印は薄く）
 *
 * 1枚だけ手で描き直したい場合は、生成後の SVG を直接編集・上書きしてよい
 * （このスクリプトを再実行すると上書きされるので、その種目は下の POSES から外す）。
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'exercises')
const FLOOR = 172

/* ---------- 部品 ---------- */

const pts = (points) => points.map(([x, y]) => `${x},${y}`).join(' ')

/** 体の線（肩→肘→手 など） */
const limb = (...points) => `<polyline points="${pts(points)}"/>`

const head = ([x, y], r = 11) => `<circle cx="${x}" cy="${y}" r="${r}"/>`

/** ダンベル。angle は持ち手の向き（度） */
const dumbbell = ([x, y], angle = 0) =>
  `<g transform="translate(${x} ${y}) rotate(${angle})" stroke-width="4">` +
  `<line x1="-9" y1="0" x2="9" y2="0"/>` +
  `<line x1="-10" y1="-7" x2="-10" y2="7" stroke-width="6"/>` +
  `<line x1="10" y1="-7" x2="10" y2="7" stroke-width="6"/></g>`

const floor = (x1 = 12, x2 = 188) =>
  `<line x1="${x1}" y1="${FLOOR}" x2="${x2}" y2="${FLOOR}" stroke-width="3" opacity="0.45"/>`

/** 椅子（座面の左端 x1〜右端 x2、座面の高さ y。back: 背もたれの位置 'left' | 'right' | null） */
const chair = (x1, x2, y, back = null) => {
  const legs = `<line x1="${x1 + 4}" y1="${y}" x2="${x1 + 4}" y2="${FLOOR}"/><line x1="${x2 - 4}" y1="${y}" x2="${x2 - 4}" y2="${FLOOR}"/>`
  const backrest =
    back === 'left'
      ? `<line x1="${x1 + 4}" y1="${y}" x2="${x1 + 4}" y2="${y - 38}"/>`
      : back === 'right'
        ? `<line x1="${x2 - 4}" y1="${y}" x2="${x2 - 4}" y2="${y - 38}"/>`
        : ''
  return `<g stroke-width="4" opacity="0.7"><line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}"/>${legs}${backrest}</g>`
}

/** 段差（カーフレイズ用） */
const step = (x1, x2, y) =>
  `<polyline points="${pts([[x1, FLOOR], [x1, y], [x2, y], [x2, FLOOR]])}" stroke-width="4" opacity="0.7"/>`

/** アブローラー */
const roller = ([x, y]) =>
  `<g stroke-width="4"><circle cx="${x}" cy="${y}" r="10"/><line x1="${x - 13}" y1="${y}" x2="${x + 13}" y2="${y}"/></g>`

/** 矢印（直線 or 2次曲線）。動く方向を示す */
function arrow(from, to, control) {
  const d = control
    ? `M${from[0]},${from[1]} Q${control[0]},${control[1]} ${to[0]},${to[1]}`
    : `M${from[0]},${from[1]} L${to[0]},${to[1]}`
  const [px, py] = control ?? from
  const angle = Math.atan2(to[1] - py, to[0] - px)
  const size = 10
  const wing = (offset) => [
    +(to[0] - size * Math.cos(angle + offset)).toFixed(1),
    +(to[1] - size * Math.sin(angle + offset)).toFixed(1),
  ]
  return (
    `<g stroke-width="4" opacity="0.55"><path d="${d}"/>` +
    `<polyline points="${pts([wing(0.5), to, wing(-0.5)])}"/></g>`
  )
}

/** ストップウォッチ（静止して時間を計る種目用） */
const stopwatch = ([x, y]) =>
  `<g stroke-width="4" opacity="0.55"><circle cx="${x}" cy="${y}" r="14"/>` +
  `<line x1="${x}" y1="${y - 22}" x2="${x}" y2="${y - 16}"/>` +
  `<polyline points="${pts([[x, y - 8], [x, y], [x + 7, y + 4]])}"/></g>`

/* ---------- ポーズ ---------- */

const POSES = {
  // 胸
  'push-up': [
    floor(),
    head([42, 108]),
    limb([60, 118], [115, 140], [142, 155], [172, 168]),
    limb([62, 119], [62, 145], [62, 170]),
    arrow([88, 78], [88, 108]),
  ],
  'wide-push-up': [
    // 正面から見た腕立て（胴は頭の後ろに隠れる）。手幅が広い
    floor(),
    head([100, 96]),
    limb([62, 116], [138, 116]),
    limb([62, 116], [40, 142], [30, 170]),
    limb([138, 116], [160, 142], [170, 170]),
    arrow([100, 40], [100, 70]),
  ],
  'decline-push-up': [
    floor(),
    chair(142, 192, 124),
    head([46, 140]),
    limb([64, 134], [125, 120], [150, 121], [172, 121]),
    limb([66, 136], [66, 152], [66, 170]),
    arrow([92, 88], [92, 116]),
  ],
  'dumbbell-floor-press': [
    floor(),
    head([36, 158]),
    limb([54, 162], [115, 164], [140, 138], [158, 169]),
    limb([62, 162], [62, 136], [62, 112]),
    dumbbell([62, 106]),
    arrow([88, 132], [88, 102]),
  ],
  'dumbbell-fly-floor': [
    // 上から見た図。仰向けで腕を左右に開く
    head([100, 44]),
    limb([100, 58], [100, 122]),
    limb([100, 122], [86, 150], [84, 182]),
    limb([100, 122], [114, 150], [116, 182]),
    limb([100, 68], [70, 76], [40, 72]),
    limb([100, 68], [130, 76], [160, 72]),
    dumbbell([34, 72], 90),
    dumbbell([166, 72], 90),
    arrow([30, 104], [78, 94], [46, 120]),
  ],

  // 背中
  'one-arm-dumbbell-row': [
    floor(),
    // 右手と右膝を椅子につき、左手でダンベルを引き上げる
    chair(120, 190, 124),
    head([48, 92]),
    limb([66, 96], [130, 96]),
    limb([130, 96], [112, 134], [108, 170]),
    limb([130, 96], [150, 121], [184, 121]),
    limb([70, 97], [96, 112], [122, 122]),
    limb([66, 98], [64, 122], [62, 142]),
    dumbbell([62, 148]),
    arrow([32, 150], [32, 116]),
  ],
  'dumbbell-bent-over-row': [
    floor(),
    head([64, 72]),
    limb([80, 80], [125, 108]),
    limb([125, 108], [114, 140], [120, 170]),
    limb([82, 82], [80, 106], [82, 128]),
    dumbbell([82, 132]),
    arrow([52, 140], [52, 108]),
  ],
  'dumbbell-pullover': [
    floor(),
    head([54, 158]),
    limb([72, 162], [125, 164], [150, 138], [170, 169]),
    limb([72, 160], [56, 136], [42, 112]),
    dumbbell([38, 106], 45),
    arrow([22, 146], [64, 88], [18, 92]),
  ],
  'back-extension': [
    floor(),
    head([50, 134]),
    limb([68, 144], [115, 166], [145, 169], [178, 169]),
    limb([72, 146], [92, 154], [110, 160]),
    arrow([36, 158], [48, 110], [24, 130]),
  ],
  superman: [
    floor(),
    head([54, 146]),
    limb([72, 154], [112, 166], [142, 160], [172, 146]),
    limb([70, 152], [46, 142], [22, 134]),
    arrow([98, 138], [98, 110]),
  ],

  // 肩
  'dumbbell-shoulder-press': [
    floor(),
    head([100, 40]),
    limb([100, 54], [100, 114]),
    limb([100, 114], [88, 142], [84, 170]),
    limb([100, 114], [112, 142], [116, 170]),
    limb([100, 62], [72, 62], [72, 36]),
    limb([100, 62], [128, 62], [128, 36]),
    dumbbell([72, 30]),
    dumbbell([128, 30]),
    arrow([168, 86], [168, 50]),
  ],
  'side-raise': [
    floor(),
    head([100, 40]),
    limb([100, 54], [100, 114]),
    limb([100, 114], [90, 142], [88, 170]),
    limb([100, 114], [110, 142], [112, 170]),
    limb([100, 62], [76, 64], [52, 66]),
    limb([100, 62], [124, 64], [148, 66]),
    dumbbell([46, 66], 90),
    dumbbell([154, 66], 90),
    arrow([150, 122], [174, 76], [178, 110]),
  ],
  'front-raise': [
    floor(),
    head([104, 40]),
    limb([100, 56], [100, 112]),
    limb([100, 112], [100, 140], [102, 170]),
    limb([100, 64], [125, 65], [150, 65]),
    dumbbell([156, 65], 90),
    arrow([120, 120], [168, 90], [166, 122]),
  ],
  'rear-raise': [
    floor(),
    head([64, 72]),
    limb([80, 80], [125, 108]),
    limb([125, 108], [114, 140], [120, 170]),
    limb([84, 82], [86, 60], [90, 40]),
    dumbbell([90, 34], 90),
    arrow([56, 130], [58, 56], [36, 94]),
  ],
  'pike-push-up': [
    floor(),
    head([70, 144]),
    limb([80, 126], [116, 84], [144, 128], [172, 170]),
    limb([82, 128], [72, 149], [64, 170]),
    arrow([42, 110], [42, 142]),
  ],

  // 腕
  'dumbbell-curl': [
    floor(),
    head([104, 40]),
    limb([100, 56], [100, 112]),
    limb([100, 112], [100, 140], [102, 170]),
    limb([100, 64], [100, 98], [124, 78]),
    dumbbell([128, 74]),
    arrow([140, 118], [144, 72], [158, 96]),
  ],
  'hammer-curl': [
    floor(),
    head([104, 40]),
    limb([100, 56], [100, 112]),
    limb([100, 112], [100, 140], [102, 170]),
    limb([100, 64], [100, 98], [124, 78]),
    dumbbell([126, 72], 90),
    arrow([140, 118], [144, 72], [158, 96]),
  ],
  'narrow-push-up': [
    // 正面から見た腕立て（胴は頭の後ろに隠れる）。手を体の真下で近づける
    floor(),
    head([100, 96]),
    limb([72, 116], [128, 116]),
    limb([72, 116], [62, 144], [94, 170]),
    limb([128, 116], [138, 144], [106, 170]),
    arrow([100, 40], [100, 70]),
  ],
  'bench-dips': [
    floor(),
    chair(30, 84, 116, 'left'),
    head([92, 68]),
    limb([90, 84], [96, 134], [142, 130], [164, 170]),
    limb([90, 88], [70, 100], [78, 116]),
    arrow([124, 64], [124, 96]),
  ],
  'dumbbell-kickback': [
    floor(),
    head([66, 88]),
    limb([84, 94], [130, 104]),
    limb([130, 104], [124, 138], [120, 170]),
    limb([86, 96], [108, 102], [138, 92]),
    dumbbell([142, 91], 90),
    arrow([112, 132], [156, 106], [148, 134]),
  ],
  'french-press': [
    floor(),
    head([106, 60]),
    limb([100, 76], [100, 126]),
    limb([100, 126], [100, 150], [102, 170]),
    limb([100, 80], [96, 42], [80, 58]),
    dumbbell([76, 62], 90),
    arrow([58, 70], [80, 22], [52, 32]),
  ],

  // 腹筋
  'ab-roller-knee': [
    floor(),
    head([62, 120]),
    limb([80, 124], [125, 140], [150, 168], [186, 168]),
    limb([82, 126], [68, 144], [52, 160]),
    roller([46, 162]),
    arrow([128, 96], [80, 96]),
  ],
  'ab-roller-standing': [
    floor(),
    head([64, 140]),
    limb([82, 140], [140, 126], [158, 148], [176, 170]),
    limb([84, 142], [62, 152], [42, 160]),
    roller([36, 162]),
    arrow([132, 94], [84, 94]),
  ],
  crunch: [
    floor(),
    head([58, 134]),
    limb([72, 146], [112, 166], [136, 136], [158, 169]),
    limb([72, 144], [80, 126], [64, 124]),
    arrow([36, 166], [50, 112], [26, 132]),
  ],
  'leg-raise': [
    floor(),
    head([36, 158]),
    limb([54, 162], [110, 165], [126, 128], [142, 92]),
    limb([56, 164], [80, 167], [100, 168]),
    arrow([178, 154], [156, 88], [182, 108]),
  ],
  plank: [
    floor(),
    head([46, 134]),
    limb([64, 140], [120, 146], [148, 157], [176, 168]),
    limb([66, 142], [66, 170], [92, 170]),
    stopwatch([124, 88]),
  ],
  'russian-twist': [
    floor(),
    head([74, 90]),
    limb([82, 108], [102, 160], [128, 130], [154, 140]),
    limb([84, 112], [104, 122], [122, 122]),
    dumbbell([128, 122], 90),
    arrow([96, 60], [150, 64], [124, 40]),
  ],

  // 脚
  squat: [
    floor(),
    head([120, 58]),
    limb([114, 76], [94, 124]),
    limb([94, 124], [134, 138], [112, 170]),
    limb([114, 82], [140, 86], [164, 86]),
    arrow([56, 92], [56, 128]),
  ],
  'dumbbell-squat': [
    floor(),
    head([120, 58]),
    limb([114, 76], [94, 124]),
    limb([94, 124], [134, 138], [112, 170]),
    limb([114, 82], [116, 104], [118, 124]),
    dumbbell([118, 130]),
    arrow([56, 92], [56, 128]),
  ],
  'bulgarian-split-squat': [
    floor(),
    chair(148, 194, 124),
    head([112, 50]),
    limb([112, 66], [114, 118]),
    limb([114, 118], [82, 126], [82, 170]),
    limb([114, 118], [138, 156], [168, 122]),
    limb([112, 74], [106, 98], [104, 118]),
    arrow([52, 72], [52, 106]),
  ],
  lunge: [
    floor(),
    head([106, 52]),
    limb([106, 68], [106, 122]),
    limb([106, 122], [70, 132], [66, 170]),
    limb([106, 122], [136, 158], [164, 168]),
    limb([106, 76], [102, 100], [100, 120]),
    arrow([150, 188], [90, 188]),
  ],
  'dumbbell-romanian-deadlift': [
    floor(),
    head([58, 78]),
    limb([74, 86], [122, 106]),
    limb([122, 106], [114, 140], [112, 170]),
    limb([76, 88], [78, 112], [82, 132]),
    dumbbell([82, 138]),
    arrow([44, 128], [52, 62], [30, 90]),
  ],
  'hip-lift': [
    floor(),
    head([34, 158]),
    limb([52, 162], [106, 126], [134, 122], [150, 169]),
    limb([54, 164], [76, 168], [96, 168]),
    arrow([106, 106], [106, 76]),
  ],
  'calf-raise': [
    floor(),
    step(80, 150, 154),
    head([112, 34]),
    limb([110, 50], [110, 104]),
    limb([110, 104], [110, 128], [114, 144], [102, 154]),
    limb([110, 58], [108, 82], [106, 104]),
    arrow([168, 128], [168, 96]),
  ],
}

function toSvg(parts) {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="none" stroke="currentColor" ` +
    `stroke-width="6" stroke-linecap="round" stroke-linejoin="round">` +
    parts.join('') +
    `</svg>\n`
  )
}

mkdirSync(OUT_DIR, { recursive: true })
for (const [id, parts] of Object.entries(POSES)) {
  const svg = toSvg(parts)
  if (svg.length > 20 * 1024) throw new Error(`${id}.svg が 20KB を超えています`)
  writeFileSync(join(OUT_DIR, `${id}.svg`), svg)
}
console.log(`generated ${Object.keys(POSES).length} files in public/exercises/`)
