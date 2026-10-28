// 피그마 TabBar (Theme=Light·Dark, Active=홈·조회·제보·정보). 아래에 떠 있는 탭 4칸.
// 선택 표시(active-pill)는 하나만 두고 켜진 탭 자리로 튕기듯 옮겨 간다 (피그마에 없는 움직임, 사용자 요청).
// 화면 아래 고정 위치·안전 영역은 TabDock이 정한다. 피그마의 HomeIndicator는 구현하지 않는다.
import type { CSSProperties } from 'react'
import { copy } from '../../copy'
import { cx } from '../cx'
import { Icon, type IconName } from '../Icon'
import styles from './TabBar.module.css'

export type Tab = '홈' | '조회' | '제보' | '정보'

type Props = {
  theme: 'Light' | 'Dark'
  active: Tab
  onSelect: (tab: Tab) => void
}

const TABS: { tab: Tab; icon: IconName }[] = [
  { tab: '홈', icon: 'home' },
  { tab: '조회', icon: 'id-card' },
  { tab: '제보', icon: 'report' },
  { tab: '정보', icon: 'info' },
]

export function TabBar({ theme, active, onSelect }: Props) {
  const index = TABS.findIndex((t) => t.tab === active)
  return (
    <nav className={cx(styles.root, styles[theme])}>
      <div className={styles.capsule}>
        <div className={styles.tabs} style={{ '--index': index, '--count': TABS.length } as CSSProperties}>
          <span className={styles.pill} aria-hidden />
          {TABS.map(({ tab, icon }) => (
            <button
              key={tab}
              type="button"
              className={cx(styles.tab, tab === active && styles.active)}
              aria-current={tab === active ? 'page' : undefined}
              onClick={() => onSelect(tab)}
            >
              <Icon name={icon} className={styles.icon} />
              <span className={styles.label}>{copy.tabBar[tab]}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  )
}
