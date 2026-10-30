// 피그마 ProductThumb (Size=S·M·L, 상태=조회·미조회)
import { copy } from '../../copy'
import { cx } from '../cx'
import { DashedOutline } from '../DashedOutline'
import styles from './ProductThumb.module.css'
import type { Category } from '../../data/categories'
import { PhotoFallback } from '../Icon'

export type ProductThumbProps = {
  size: 'S' | 'M' | 'L'
  상태: '조회' | '미조회'
  /** 음식 사진(배경 제거 webp). 없으면 피그마처럼 빈 사진 자리 */
  src?: string
  /** 사진이 없을 때 대신 보일 분류 아이콘 */
  fallback?: Category | null
  className?: string
}

export function ProductThumb({ size, 상태, src, fallback, className }: ProductThumbProps) {
  if (상태 === '미조회') {
    return (
      <span className={cx(styles.root, styles.unseen, className)}>
        <DashedOutline className={styles.dash} />
        <span className={styles.unknown}>{copy.unknownThumb}</span>
      </span>
    )
  }
  return (
    <span className={cx(styles.root, styles[size], className)}>
      <span className={styles.photo}>{src ? <img src={src} alt="" className={styles.img} /> : <PhotoFallback category={fallback} />}</span>
    </span>
  )
}
