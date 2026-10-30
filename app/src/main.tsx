import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/fonts.css'
import './styles/tokens.css'
import './styles/base.css'
import './styles/motion.css'
import './styles/drag-scroll.css'
import './screens/stage.css'
import App from './App.tsx'
import { IS_TOSS } from './config/target'
import { startDesktopFrame } from './screens/desktopFrame'
import { listenInstall } from './store/install'
import { startReportSync } from './store/reports'

// PC 화면 틀·설치 안내는 PWA만 (토스 미니앱은 토스 앱 안에서만 열리고 설치 유도가 금지)
if (!IS_TOSS) {
  startDesktopFrame()
  listenInstall()
}
startReportSync()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// 개발용: 브라우저 콘솔에서 compareScreen('main') 등으로 피그마 화면과 비교
if (import.meta.env.DEV) import('./dev/compareLayout').then((m) => Object.assign(window, m))
