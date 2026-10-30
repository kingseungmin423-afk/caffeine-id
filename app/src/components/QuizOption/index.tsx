// 피그마 QuizOption. 02 비교 퀴즈 선택지.
// 고른 뒤 결과(피그마에 없는 상태): 정답은 파란(status/info), 오답은 빨간(border/danger) 테두리
import { cx } from '../cx'
import { ProductThumb } from '../ProductThumb'
import styles from './QuizOption.module.css'
import type { Category } from '../../data/categories'

type Props = {
  name: string
  sub: string
  photoSrc?: string
  photoFallback?: Category | null
  result?: '정답' | '오답'
  onClick?: () => void
}

export function QuizOption({ name, sub, photoSrc, photoFallback, result, onClick }: Props) {
  return (
    <button
      type="button"
      className={cx(styles.root, result === '정답' && styles.correct, result === '오답' && styles.wrong)}
      onClick={onClick}
      aria-pressed={result ? true : undefined}
    >
      <ProductThumb size="L" 상태="조회" src={photoSrc} fallback={photoFallback} />
      <span className={styles.text}>
        <span className={styles.name}>{name}</span>
        <span className={styles.sub}>{sub}</span>
      </span>
    </button>
  )
}
