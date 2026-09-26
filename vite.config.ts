import { createHash } from 'node:crypto'
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import { APP_CONFIG } from './src/config/app.ts'

/** 画面に表示するバージョン。上げるときは `npm version patch --no-git-tag-version` など */
const APP_VERSION: string = JSON.parse(readFileSync('package.json', 'utf8')).version

function listFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? listFiles(path) : [path]
  })
}

/**
 * sw/sw.js をテンプレートとして、ビルド結果に合わせた dist/sw.js を作る。
 * - キャッシュするファイル一覧をビルド結果から自動で作る（手で書くと漏れるため）
 * - ビルド結果の中身からハッシュを作って埋め込む。中身が変わると sw.js も必ず変わるので、
 *   バージョンを上げ忘れても、公開すればアプリ側で「更新があります」が出る
 */
function serviceWorker(): Plugin {
  let root = ''
  let outDir = ''
  return {
    name: 'workout-calendar:service-worker',
    apply: 'build',
    configResolved(config) {
      root = config.root
      outDir = resolve(config.root, config.build.outDir)
    },
    closeBundle() {
      const files = listFiles(outDir)
        .map((path) => relative(outDir, path).replaceAll('\\', '/'))
        // sw.js 自身と、.nojekyll のような隠しファイルはキャッシュしない
        .filter((path) => path !== 'sw.js' && !path.split('/').some((p) => p.startsWith('.')))
        .sort()

      const hash = createHash('sha256')
      for (const path of files) {
        hash.update(path)
        hash.update(readFileSync(join(outDir, path)))
      }
      const buildId = hash.digest('hex').slice(0, 12)

      const template = readFileSync(resolve(root, 'sw/sw.js'), 'utf8')
      const replacements: Array<[string, string]> = [
        [`'__APP_VERSION__'`, JSON.stringify(APP_VERSION)],
        [`'__BUILD_ID__'`, JSON.stringify(buildId)],
        [`'__CACHE_PREFIX__'`, JSON.stringify(APP_CONFIG.cachePrefix)],
        ['[/* __ASSETS__ */]', JSON.stringify(files.map((path) => `./${path}`), null, 2)],
      ]
      let code = template
      for (const [placeholder, value] of replacements) {
        if (!code.includes(placeholder)) {
          throw new Error(`sw/sw.js に ${placeholder} が見つかりません`)
        }
        code = code.replace(placeholder, value)
      }
      writeFileSync(join(outDir, 'sw.js'), code)
      console.log(`sw.js: バージョン ${APP_VERSION}（${buildId}）、キャッシュ対象 ${files.length} 件`)
    },
  }
}

/** manifest.webmanifest の中身（公開パスやアプリ名は src/config/app.ts から） */
function buildManifest(): string {
  const manifest = {
    id: APP_CONFIG.manifestId,
    name: APP_CONFIG.appName,
    short_name: APP_CONFIG.shortName,
    description: APP_CONFIG.description,
    start_url: APP_CONFIG.basePath,
    scope: APP_CONFIG.basePath,
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#f4f5f7',
    theme_color: '#4f46e5',
    lang: 'ja',
    icons: [
      { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      {
        src: 'icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
  return JSON.stringify(manifest, null, 2)
}

/**
 * src/config/app.ts の値を、manifest.webmanifest と index.html に反映する。
 * index.html の __APP_NAME__ などを置き換え、manifest はビルド時に生成する（開発中はその場で返す）。
 */
function appConfig(): Plugin {
  return {
    name: 'workout-calendar:app-config',
    transformIndexHtml(html) {
      return html
        .replaceAll('__APP_NAME__', APP_CONFIG.appName)
        .replaceAll('__APP_SHORT_NAME__', APP_CONFIG.shortName)
        .replaceAll('__APP_DESCRIPTION__', APP_CONFIG.description)
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.split('?')[0] !== `${APP_CONFIG.basePath}manifest.webmanifest`) return next()
        res.setHeader('Content-Type', 'application/manifest+json')
        res.end(buildManifest())
      })
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'manifest.webmanifest', source: buildManifest() })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  // 公開パス（GitHub Pages のリポジトリ名）。src/config/app.ts で設定する
  base: APP_CONFIG.basePath,
  define: {
    __APP_VERSION__: JSON.stringify(APP_VERSION),
  },
  plugins: [react(), tailwindcss(), appConfig(), serviceWorker()],
  server: {
    host: true, // iPhone から LAN 経由で開けるように
  },
})
