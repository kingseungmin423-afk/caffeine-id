// 피그마 Chip (Selected=On·Off)
// 켜고 끌 때 크기가 변하지 않도록: 글자 폭은 굵은(On) 글자 기준으로 미리 잡고, 안쪽 여백은 테두리까지 포함해 같게 둔다.
import type { ButtonHTMLAttributes } from 'react'
import { cx } from '../cx'
import styles from './Chip.module.css'

type Props = { selected: boolean; children: string } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type' | 'children'>

export function Chip({ selected, className, children, ...rest }: Props) {
  return (
    <button type="button" aria-pressed={selected} className={cx(styles.root, selected ? styles.on : styles.off, className)} {...rest}>
      <span className={styles.label} data-text={children}>
        {children}
      </span>
    </button>
  )
}
