// 피그마 RelatedCard (상태=조회·미조회). 05·06 관련 음식 카드(어두운 배경).
import { copy } from '../../copy'
import { cx } from '../cx'
import { DashedOutline } from '../DashedOutline'
import styles from './RelatedCard.module.css'
import type { Category } from '../../data/categories'
import { PhotoFallback } from '../Icon'

type Props = {
  상태: '조회' | '미조회'
  category: string
  name: string
  /** 조회한 음식 함량 (예: '38mg') */
  amount?: string
  photoSrc?: string
  photoFallback?: Category | null
  onClick?: () => void
}

export function RelatedCard({ 상태, category, name, amount, photoSrc, photoFallback, onClick }: Props) {
  const seen = 상태 === '조회'
  return (
    <button type="button" className={cx(styles.root, styles[상태])} onClick={onClick}>
      {!seen && <DashedOutline className={styles.dashCard} />}
      <span className={styles.handle}>
        <span className={styles.bar} />
      </span>
      <span className={styles.illustBox}>
        {seen ? (
          <span className={styles.photo}>{photoSrc ? <img src={photoSrc} alt="" className={styles.img} /> : <PhotoFallback category={photoFallback} />}</span>
        ) : (
          <>
            <DashedOutline className={styles.dashBox} />
            <span className={styles.unknown}>{copy.idCard.unknownPhoto}</span>
          </>
        )}
      </span>
      <span className={styles.text}>
        <span className={styles.category}>{category}</span>
        <span className={styles.name}>{name}</span>
        <span className={styles.bottom}>
          <span className={styles.amount}>{seen ? amount : copy.idCard.unknownAmount}</span>
          <span className={styles.status}>{seen ? copy.badge.caffeine : copy.stamp.unissued}</span>
        </span>
      </span>
    </button>
  )
}
