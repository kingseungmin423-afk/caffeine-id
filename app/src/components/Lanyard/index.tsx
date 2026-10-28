// 피그마 Lanyard (Theme=Dark·Light·Visitor, Length=Long·Short)
import { copy } from '../../copy'
import { cx } from '../cx'
import styles from './Lanyard.module.css'

type Props = {
  theme: 'Dark' | 'Light' | 'Visitor'
  /** 피그마에는 Short가 Dark에만 있다 (온보딩·로딩) */
  length: 'Long' | 'Short'
  className?: string
}

export function Lanyard({ theme, length, className }: Props) {
  return (
    <div className={cx(styles.root, styles[theme], styles[length], className)} aria-hidden>
      <div className={styles.strap} />
      <span className={styles.label}>{theme === 'Visitor' ? copy.lanyard.visitor : copy.lanyard.id}</span>
      <div className={styles.clip} />
      <div className={styles.connector} />
      <div className={styles.ring} />
    </div>
  )
}
