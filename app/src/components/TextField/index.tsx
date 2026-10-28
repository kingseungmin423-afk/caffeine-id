// 피그마 TextField (State=Filled·Empty, 라벨 포함). 값이 있거나 입력 중이면 Filled(굵은 테두리).
import { useId, type InputHTMLAttributes } from 'react'
import { cx } from '../cx'
import styles from './TextField.module.css'

type Props = { label: string; value: string } & InputHTMLAttributes<HTMLInputElement>

export function TextField({ label, value, className, id, ...rest }: Props) {
  const autoId = useId()
  const inputId = id ?? autoId
  return (
    <div className={cx(styles.root, className)}>
      <label htmlFor={inputId} className={styles.label}>
        {label}
      </label>
      <div className={cx(styles.box, value !== '' && styles.filled)}>
        <input id={inputId} className={styles.input} value={value} {...rest} />
      </div>
    </div>
  )
}
