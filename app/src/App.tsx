// 화면 주소 (CLAUDE.md 화면·주소 표)
import { lazy, Suspense, useEffect, type ReactNode } from 'react'
import { BrowserRouter, HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { IS_TOSS } from './config/target'
import { loadDb } from './data/db'
import Category from './screens/Category'
import CategoryDetail from './screens/CategoryDetail'
import Estimate from './screens/Estimate'
import Info from './screens/Info'
import Loading from './screens/Loading'
import Main from './screens/Main'
import Report from './screens/Report'
import Result from './screens/Result'
import Search from './screens/Search'
import Welcome from './screens/Welcome'
import { paths } from './screens/links'
import { ScrollManager } from './screens/ScrollManager'
import { TabDockProvider } from './screens/TabDock'
import { useVisits } from './store/visits'

// 토스 미니앱은 번들 파일을 그대로 열기 때문에 주소를 #/item/… 형태로 쓴다 (PWA는 지금처럼 /item/…)
const Router = IS_TOSS ? HashRouter : BrowserRouter

const Gallery = import.meta.env.DEV ? lazy(() => import('./dev/Gallery')) : null

/** 처음 방문자는 메인 대신 온보딩 */
function FirstVisit({ children }: { children: ReactNode }) {
  const { onboarded } = useVisits()
  return onboarded ? children : <Navigate to={paths.welcome} replace />
}

export default function App() {
  // DB는 첫 화면을 그리는 동안 미리 받아 둔다
  useEffect(() => {
    loadDb()
  }, [])
  return (
    <Router>
      <ScrollManager />
      <TabDockProvider>
      <Routes>
        <Route path="/welcome" element={<Welcome />} />
        <Route
          path="/"
          element={
            <FirstVisit>
              <Main />
            </FirstVisit>
          }
        />
        <Route path="/category" element={<Category />} />
        <Route path="/category/:category" element={<CategoryDetail />} />
        <Route path="/search" element={<Search />} />
        <Route path="/check" element={<Loading />} />
        <Route path="/item/:id" element={<Result />} />
        <Route path="/estimate" element={<Estimate />} />
        <Route path="/report" element={<Report />} />
        <Route path="/info" element={<Info />} />
        {Gallery && (
          <Route
            path="/dev/gallery"
            element={
              <Suspense>
                <Gallery />
              </Suspense>
            }
          />
        )}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </TabDockProvider>
    </Router>
  )
}
