// 피그마 RankRow (Highlight=On·Off). TOP 5 한 줄, 1위만 순위 숫자 강조.
import { cx } from '../cx'
import { ProductThumb } from '../ProductThumb'
import styles from './RankRow.module.css'

type Props = { rank: number; highlight: boolean; name: string; meta: string; amount: string; photoSrc?: string; onClick?: () => void }

export function RankRow({ rank, highlight, name, meta, amount, photoSrc, onClick }: Props) {
  return (
    <button type="button" className={styles.root} onClick={onClick}>
      <span className={cx(styles.rank, highlight && styles.highlight)}>{rank}</span>
      <ProductThumb size="S" 상태="조회" src={photoSrc} />
      <span className={styles.text}>
        <span className={styles.name}>{name}</span>
        <span className={styles.meta}>{meta}</span>
      </span>
      <span className={styles.amount}>{amount}</span>
    </button>
  )
}
