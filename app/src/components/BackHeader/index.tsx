// 피그마 BackHeader (Theme=Light·Dark). 02-1 카테고리처럼 제목 없이 화살표만 쓸 수도 있다.
import { copy } from '../../copy'
import { cx } from '../cx'
import { Icon } from '../Icon'
import styles from './BackHeader.module.css'

type Props = { theme: 'Light' | 'Dark'; title?: string; onBack: () => void; className?: string }

export function BackHeader({ theme, title, onBack, className }: Props) {
  return (
    <button type="button" className={cx(styles.root, styles[theme], className)} onClick={onBack} aria-label={title ? undefined : copy.backHeader.back}>
      <Icon name="chevron-left" className={styles.icon} />
      {title && <span className={styles.title}>{title}</span>}
    </button>
  )
}
