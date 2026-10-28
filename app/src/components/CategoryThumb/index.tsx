// 피그마 CategoryThumb (Size=L·M)
import type { Category } from '../../data/categories'
import { cx } from '../cx'
import { CategoryIcon } from '../Icon'
import styles from './CategoryThumb.module.css'

export function CategoryThumb({ size, category, className }: { size: 'L' | 'M'; category: Category; className?: string }) {
  return (
    <span className={cx(styles.root, styles[size], className)}>
      <CategoryIcon category={category} className={styles.icon} />
    </span>
  )
}
