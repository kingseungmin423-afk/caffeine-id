// 피그마 Button (Style=White·Navy). White는 어두운 화면, Navy는 밝은 화면에 쓴다.
import type { ButtonHTMLAttributes } from 'react'
import { cx } from '../cx'
import styles from './Button.module.css'

type Props = { variant: 'White' | 'Navy' } & ButtonHTMLAttributes<HTMLButtonElement>

export function Button({ variant, className, type = 'button', ...rest }: Props) {
  return <button type={type} className={cx(styles.root, styles[variant], className)} {...rest} />
}
