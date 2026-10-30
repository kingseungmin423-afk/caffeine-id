// 피그마 FoodRow (상태=조회·미조회). 미조회는 ??mg, 배지 없음.
import { copy } from '../../copy'
import { Badge } from '../Badge'
import { cx } from '../cx'
import { ProductThumb } from '../ProductThumb'
import styles from './FoodRow.module.css'
import type { Category } from '../../data/categories'

type Props = {
  상태: '조회' | '미조회'
  name: string
  meta: string
  /** 조회한 음식의 함량 표시 (예: '38mg') */
  amount?: string
  /** 카페인이 있으면 배지 표시 (조회 상태에서만) */
  hasCaffeine?: boolean
  photoSrc?: string
  photoFallback?: Category | null
  onClick?: () => void
}

export function FoodRow({ 상태, name, meta, amount, hasCaffeine, photoSrc, photoFallback, onClick }: Props) {
  const seen = 상태 === '조회'
  return (
    <button type="button" className={styles.root} onClick={onClick}>
      <ProductThumb size="M" 상태={상태} src={photoSrc} fallback={photoFallback} />
      <span className={styles.text}>
        <span className={styles.name}>{name}</span>
        <span className={styles.meta}>{meta}</span>
      </span>
      <span className={styles.value}>
        <span className={cx(styles.amount, !seen && styles.unknown)}>{seen ? amount : copy.idCard.unknownAmount}</span>
        {seen && hasCaffeine && <Badge />}
      </span>
    </button>
  )
}
