import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { registerServiceWorker } from './pwa.ts'
import { bootLoad } from './lib/dataImport.ts'

// 画面を描画する前に、保存データを読み込む（必要なら移行する）
const boot = bootLoad()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App boot={boot} />
  </StrictMode>,
)

registerServiceWorker()
