// 피그마 CategoryCard. 02-1 카테고리 카드(아이콘 + 이름 + 예시).
import type { Category } from '../../data/categories'
import { CategoryThumb } from '../CategoryThumb'
import styles from './CategoryCard.module.css'

export function CategoryCard({ category, examples, onClick }: { category: Category; examples: string; onClick?: () => void }) {
  return (
    <button type="button" className={styles.root} onClick={onClick}>
      <CategoryThumb size="M" category={category} />
      <span className={styles.text}>
        <span className={styles.title}>{category}</span>
        <span className={styles.examples}>{examples}</span>
      </span>
    </button>
  )
}
