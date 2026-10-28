// 피그마 Badge (Type=있음)
import { copy } from '../../copy'
import styles from './Badge.module.css'

export function Badge() {
  return <span className={styles.root}>{copy.badge.caffeine}</span>
}
