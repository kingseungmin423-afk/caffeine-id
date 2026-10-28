// 피그마 SearchField (State=Empty·Filled). 입력 중이거나 값이 있으면 Filled(굵은 테두리).
import type { InputHTMLAttributes } from 'react'
import { copy } from '../../copy'
import { cx } from '../cx'
import { Icon } from '../Icon'
import styles from './SearchField.module.css'

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & { value: string }

export function SearchField({ className, value, placeholder = copy.searchField.placeholder, ...rest }: Props) {
  return (
    <label className={cx(styles.root, value !== '' && styles.filled, className)}>
      <Icon name="search" className={styles.icon} />
      <input type="search" enterKeyHint="search" className={styles.input} value={value} placeholder={placeholder} {...rest} />
    </label>
  )
}
