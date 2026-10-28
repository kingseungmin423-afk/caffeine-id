// 피그마 점선 테두리(INSIDE, dashPattern)를 그대로 그린다. CSS border-style: dashed는 점선 길이를 정할 수 없어서 SVG를 쓴다.
// 부모는 position: relative 여야 한다. 굵기·점선·모서리·색은 CSS 변수로 넘긴다.
import styles from './DashedOutline.module.css'

export function DashedOutline({ className }: { className?: string }) {
  return (
    <svg className={[styles.root, className].filter(Boolean).join(' ')} aria-hidden>
      <rect className={styles.rect} />
    </svg>
  )
}
