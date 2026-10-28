// 피그마 CategoryItem. 02 메인 카테고리 격자 칸(아이콘 + 이름).
import type { Category } from '../../data/categories'
import { CategoryThumb } from '../CategoryThumb'
import styles from './CategoryItem.module.css'

export function CategoryItem({ category, onClick }: { category: Category; onClick?: () => void }) {
  return (
    <button type="button" className={styles.root} onClick={onClick}>
      <CategoryThumb size="L" category={category} />
      <span className={styles.label}>{category}</span>
    </button>
  )
}
