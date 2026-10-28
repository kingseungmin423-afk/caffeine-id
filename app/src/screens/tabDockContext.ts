// 화면 → 탭바(TabDock) 연결: 화면이 '어느 탭을 켤지·테마'를 알려 준다.
import { createContext, useContext, useLayoutEffect } from 'react'
import type { Tab } from '../components/TabBar'

export type Dock = { theme: 'Light' | 'Dark'; tab?: Tab }

export const TabDockContext = createContext<(d: Dock) => void>(() => {})

/** 화면에서 호출: 이 화면의 탭바 상태 */
export function useTabDock(theme: Dock['theme'], tab: Tab | undefined) {
  const set = useContext(TabDockContext)
  useLayoutEffect(() => {
    set({ theme, tab })
  }, [set, theme, tab])
}
