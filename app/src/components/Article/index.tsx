// 피그마 Article. 09 발급 규정 조항(제목 + 본문).
import type { ReactNode } from 'react'
import styles from './Article.module.css'

export function Article({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section className={styles.root}>
      <h3 className={styles.heading}>{heading}</h3>
      <div className={styles.body}>{children}</div>
    </section>
  )
}
