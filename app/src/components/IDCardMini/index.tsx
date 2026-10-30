// 피그마 IDCardMini (상태=발급·미발급). 02-2 카테고리 상세의 작은 신분증. 미발급은 점선·??mg.
import { copy } from '../../copy'
import { cx } from '../cx'
import { DashedOutline } from '../DashedOutline'
import styles from './IDCardMini.module.css'
import type { Category } from '../../data/categories'
import { Icon, PhotoFallback } from '../Icon'

type Props = {
  상태: '발급' | '미발급'
  name: string
  serving: string
  /** 발급 카드 번호 (예: 'No. CF-0005') */
  serial?: string
  /** 발급 카드 함량 (예: '54mg') */
  amount?: string
  photoSrc?: string
  photoFallback?: Category | null
  /** 북마크한 음식: 제목 줄 오른쪽 끝에 작은 북마크 표시 (피그마에 없음, 사용자 요청) */
  bookmarked?: boolean
  onClick?: () => void
}

export function IDCardMini({ 상태, name, serving, serial, amount, photoSrc, photoFallback, bookmarked, onClick }: Props) {
  const issued = 상태 === '발급'
  return (
    <button type="button" className={cx(styles.root, styles[상태])} onClick={onClick}>
      {!issued && <DashedOutline className={styles.dashCard} />}
      <span className={styles.handle}>
        <span className={styles.bar} />
      </span>
      <span className={styles.titleRow}>
        <span className={styles.title}>{copy.idCard.title}</span>
        <span className={styles.idMark}>
          <span className={styles.idText}>{copy.idCard.idMark}</span>
        </span>
        {bookmarked && <Icon name="bookmark-fill" className={styles.bookmark} aria-label={copy.categoryDetail.bookmarked} role="img" aria-hidden={false} />}
      </span>
      <span className={styles.photoBox}>
        {issued ? (
          <span className={styles.photo}>{photoSrc ? <img src={photoSrc} alt="" className={styles.img} /> : <PhotoFallback category={photoFallback} />}</span>
        ) : (
          <>
            <DashedOutline className={styles.dashBox} />
            <span className={styles.unknown}>{copy.idCard.unknownPhoto}</span>
          </>
        )}
      </span>
      <span className={styles.stamp}>
        <span className={styles.innerRing} />
        <span className={issued ? styles.stampIssued : styles.stampUnissued}>{issued ? copy.stamp.caffeine : copy.stamp.unissued}</span>
      </span>
      <span className={styles.info}>
        <span className={styles.name}>{name}</span>
        <span className={styles.metaRow}>
          <span className={styles.meta}>{serving}</span>
          <span className={styles.meta}>{issued ? serial : copy.idCard.unknownSerial}</span>
        </span>
      </span>
      <span className={styles.stat}>
        <span className={styles.label}>{copy.idCard.caffeineAmount}</span>
        <span className={styles.value}>{issued ? amount : copy.idCard.unknownAmount}</span>
      </span>
    </button>
  )
}
