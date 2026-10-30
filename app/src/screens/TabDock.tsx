// 화면 아래 탭바. 화면이 바뀌어도 사라졌다 다시 생기지 않도록 앱에 하나만 두고,
// 각 화면(Screen)이 '어느 탭을 켤지·밝은/어두운 테마'만 알려 준다. 그래야 선택 표시가 탭 사이를 튕기며 옮겨 간다.
import { useEffect, useLayoutEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { cx } from '../components/cx'
import { IS_TOSS } from '../config/target'
import { TabBar, type Tab } from '../components/TabBar'
import { getLastLookup } from '../store/nav'
import { paths } from './links'
import { TabDockContext, type Dock } from './tabDockContext'
import styles from './TabDock.module.css'

export function TabDockProvider({ children }: { children: ReactNode }) {
  const [dock, setDock] = useState<Dock>({ theme: 'Light' })
  return (
    <TabDockContext.Provider value={setDock}>
      {children}
      <TabDock {...dock} />
    </TabDockContext.Provider>
  )
}

function TabDock({ theme, tab }: Dock) {
  const navigate = useNavigate()
  // 탭바가 숨겨진 화면(온보딩·로딩·제보 접수)에서도 마지막 탭 모양을 유지한 채 아래로 내려간다
  const [last, setLast] = useState<Tab>('홈')
  useLayoutEffect(() => {
    if (tab) setLast(tab)
  }, [tab])
  // 휴대폰 상단 바(theme-color)도 화면 배경을 따라간다. 토스 미니앱은 토스 내비게이션 바를 같은 색으로
  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]')
    const color = getComputedStyle(document.documentElement).getPropertyValue(theme === 'Dark' ? '--bg-inverse' : '--bg-canvas').trim()
    meta?.setAttribute('content', color)
    if (IS_TOSS) void import('../toss/bridge').then((t) => t.matchNavigationBar(theme, color))
  }, [theme])

  const select = (t: Tab) => {
    if (t === tab && t !== '조회') return
    if (t === '홈') navigate(paths.main)
    else if (t === '제보') navigate(paths.report())
    else if (t === '정보') navigate(paths.info)
    else if (tab !== '조회') {
      // 조회: 마지막으로 보던 조회 화면과 스크롤 위치로 (처음이면 검색)
      const lookup = getLastLookup()
      navigate(lookup?.path ?? paths.search(), { state: { scrollY: lookup?.scrollY ?? 0 } })
    }
  }

  return (
    <div className={cx(styles.dock, !tab && styles.hidden)} aria-hidden={!tab}>
      <TabBar theme={theme} active={tab ?? last} onSelect={select} />
    </div>
  )
}
