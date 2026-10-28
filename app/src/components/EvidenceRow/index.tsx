// 피그마 EvidenceRow. 07 추정 근거 한 줄(어두운 배경).
import { ProductThumb } from '../ProductThumb'
import styles from './EvidenceRow.module.css'

type Props = { name: string; amount: string; photoSrc?: string; onClick?: () => void }

export function EvidenceRow({ name, amount, photoSrc, onClick }: Props) {
  return (
    <button type="button" className={styles.root} onClick={onClick}>
      <ProductThumb size="M" 상태="조회" src={photoSrc} />
      <span className={styles.name}>{name}</span>
      <span className={styles.amount}>{amount}</span>
    </button>
  )
}
