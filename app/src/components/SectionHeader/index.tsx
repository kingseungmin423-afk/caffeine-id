// 피그마 SectionHeader (Theme=Light·Dark). onMore가 있으면 '전체 보기'를 보여 준다.
import { copy } from '../../copy'
import { cx } from '../cx'
import styles from './SectionHeader.module.css'

type Props = { theme: 'Light' | 'Dark'; title: string; onMore?: () => void; className?: string }

export function SectionHeader({ theme, title, onMore, className }: Props) {
  return (
    <div className={cx(styles.root, styles[theme], className)}>
      <h2 className={styles.title}>{title}</h2>
      {onMore && (
        <button type="button" className={styles.more} onClick={onMore}>
          {copy.sectionHeader.more}
        </button>
      )}
    </div>
  )
}
