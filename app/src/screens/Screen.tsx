// 모든 화면의 바탕: 배경색(밝은·어두운), 375 기준 폭, 들어올 때 전환. 탭바는 TabDock이 앱에 하나만 그린다.
import type { ReactNode } from 'react'
import { cx } from '../components/cx'
import type { Tab } from '../components/TabBar'
import { usePageMeta, type PageMeta } from './pageMeta'
import { useTabDock } from './tabDockContext'
import styles from './Screen.module.css'

type Props = {
  theme: 'Light' | 'Dark'
  /** 탭바에서 켜 둘 탭. 없으면 탭바를 숨긴다 (온보딩·로딩·제보 접수) */
  tab?: Tab
  className?: string
  /** 브라우저 탭 제목·검색 설명 (없으면 홈 기준) */
  meta?: PageMeta
  children: ReactNode
}

export function Screen({ theme, tab, className, meta, children }: Props) {
  useTabDock(theme, tab)
  usePageMeta(meta)
  return (
    <div className={cx(styles.root, styles[theme])}>
      <main className={cx(styles.column, className)}>{children}</main>
    </div>
  )
}
