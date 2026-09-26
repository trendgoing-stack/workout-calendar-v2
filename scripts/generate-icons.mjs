/**
 * PWA 用アイコン(PNG)を生成するスクリプト。外部ライブラリは使わない。
 *   node scripts/generate-icons.mjs
 */
import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons')

const BG = [79, 70, 229] // indigo-600
const FG = [255, 255, 255]

function crc32(buf) {
  let c
  const table = []
  for (let n = 0; n < 256; n++) {
    c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c >>> 0
  }
  let crc = 0xffffffff
  for (const byte of buf) crc = table[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(typeAndData))
  return Buffer.concat([length, typeAndData, crc])
}

function encodePng(size, pixelAt) {
  const raw = Buffer.alloc(size * (size * 3 + 1))
  let offset = 0
  for (let y = 0; y < size; y++) {
    raw[offset++] = 0 // filter: none
    for (let x = 0; x < size; x++) {
      const [r, g, b] = pixelAt(x / size, y / size)
      raw[offset++] = r
      raw[offset++] = g
      raw[offset++] = b
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 2 // color type: truecolor
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

/** ダンベルの形（0..1 の正規化座標） */
function isDumbbell(x, y, scale) {
  const cx = 0.5
  const cy = 0.5
  const nx = (x - cx) / scale + cx
  const ny = (y - cy) / scale + cy
  const inRect = (x0, y0, x1, y1) => nx >= x0 && nx <= x1 && ny >= y0 && ny <= y1
  return (
    inRect(0.3, 0.455, 0.7, 0.545) || // シャフト
    inRect(0.2, 0.33, 0.31, 0.67) || // 内側プレート(左)
    inRect(0.69, 0.33, 0.8, 0.67) || // 内側プレート(右)
    inRect(0.13, 0.4, 0.2, 0.6) || // 外側プレート(左)
    inRect(0.8, 0.4, 0.87, 0.6) // 外側プレート(右)
  )
}

/*
 * β 版の目印：ダンベルの下に、オレンジの丸に白い「β」のバッジを付ける。
 * （ホーム画面で既存版のアイコンと区別するため。角丸で欠けないよう下中央に置く）
 */
const BADGE = [245, 158, 11] // amber-500
const BADGE_CENTER = [0.5, 0.8]
const BADGE_RADIUS = 0.15

/** 円弧を折れ線にする（バッジ内の座標。角度は度、時計回り） */
function arc(cx, cy, r, from, to, steps = 16) {
  return Array.from({ length: steps + 1 }, (_, i) => {
    const a = ((from + ((to - from) * i) / steps) * Math.PI) / 180
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)]
  })
}

/** 「β」の字形（バッジの中心を原点、半径を 1 とする座標の折れ線） */
const BETA_STROKES = [
  [[-0.32, -0.6], [-0.32, 0.8]], // 縦棒
  [[-0.32, -0.38], ...arc(-0.04, -0.38, 0.28, 180, 450), [-0.12, -0.1]], // 上のふくらみ
  [[-0.12, -0.1], ...arc(-0.02, 0.26, 0.36, -90, 90), [-0.32, 0.62]], // 下のふくらみ
]
const BETA_WIDTH = 0.11

function distanceToSegment(px, py, [ax, ay], [bx, by]) {
  const dx = bx - ax
  const dy = by - ay
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy || 1)))
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy))
}

/** バッジ上の点なら色を返す（バッジの外なら null） */
function badgeColor(nx, ny) {
  const u = (nx - BADGE_CENTER[0]) / BADGE_RADIUS
  const v = (ny - BADGE_CENTER[1]) / BADGE_RADIUS
  if (u * u + v * v > 1) return null
  for (const stroke of BETA_STROKES) {
    for (let i = 0; i < stroke.length - 1; i++) {
      if (distanceToSegment(u, v, stroke[i], stroke[i + 1]) < BETA_WIDTH) return FG
    }
  }
  return BADGE
}

function makeIcon(size, { maskable }) {
  const scale = maskable ? 0.72 : 1
  const colorAt = (x, y) => {
    const nx = (x - 0.5) / scale + 0.5
    const ny = (y - 0.5) / scale + 0.5
    return badgeColor(nx, ny) ?? (isDumbbell(x, y, scale) ? FG : BG)
  }
  // 4×4 のサンプルを平均してふちを滑らかにする
  const n = 4
  return encodePng(size, (x, y) => {
    const sum = [0, 0, 0]
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const c = colorAt(x + (i + 0.5) / n / size, y + (j + 0.5) / n / size)
        sum[0] += c[0]
        sum[1] += c[1]
        sum[2] += c[2]
      }
    }
    return sum.map((v) => Math.round(v / (n * n)))
  })
}

mkdirSync(OUT_DIR, { recursive: true })
const files = [
  ['icon-192.png', 192, { maskable: false }],
  ['icon-512.png', 512, { maskable: false }],
  ['icon-maskable-512.png', 512, { maskable: true }],
  ['apple-touch-icon.png', 180, { maskable: false }],
]
for (const [name, size, options] of files) {
  writeFileSync(join(OUT_DIR, name), makeIcon(size, options))
  console.log('generated', name)
}
