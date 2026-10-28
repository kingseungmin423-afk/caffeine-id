import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/fonts.css'
import './styles/tokens.css'
import './styles/base.css'
import './styles/motion.css'
import './styles/drag-scroll.css'
import './screens/stage.css'
import App from './App.tsx'
import { startDesktopFrame } from './screens/desktopFrame'
import { listenInstall } from './store/install'
import { startReportSync } from './store/reports'

startDesktopFrame()
listenInstall()
startReportSync()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// 개발용: 브라우저 콘솔에서 compareScreen('main') 등으로 피그마 화면과 비교
if (import.meta.env.DEV) import('./dev/compareLayout').then((m) => Object.assign(window, m))
