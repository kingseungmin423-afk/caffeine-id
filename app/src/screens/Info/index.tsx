// 09 정보 (발급 규정, /info) + 사진 출처 목록 (CC BY·BY-SA 표시 의무)
import { useState } from 'react'
import { Article } from '../../components/Article'
import { IS_TOSS } from '../../config/target'
import { copy } from '../../copy'
import { allPhotos, creditLine } from '../../data/photos'
import { Screen } from '../Screen'
import styles from './Info.module.css'

export default function Info() {
  const photos = allPhotos().sort((a, b) => a.name_ko.localeCompare(b.name_ko, 'ko'))
  const [creditsOpen, setCreditsOpen] = useState(false)
  return (
    <Screen theme="Light" tab="정보" className={styles.screen}>
      <h1 className={styles.headline}>{copy.info.headline}</h1>
      <div className={styles.articles}>
        {copy.info.articles.map((a) => (
          <Article key={a.heading} heading={a.heading}>
            {a.body}
          </Article>
        ))}
      </div>
      <p className={styles.footer}>{copy.info.footer}</p>

      {/* 피그마에 없는 부분: 조항과 같은 글자 스타일로 맨 아래에. 길어서 평소에는 접어 둔다 */}
      <section className={styles.credits}>
        <button
          type="button"
          className={styles.creditsToggle}
          aria-expanded={creditsOpen}
          aria-controls="photo-credits"
          onClick={() => setCreditsOpen((o) => !o)}
        >
          <span className={styles.creditsHeading}>{copy.info.photoCredits}</span>
          <span className={styles.creditsAction}>{creditsOpen ? copy.info.close : copy.info.open(photos.length)}</span>
        </button>
        {creditsOpen && (
          <ul id="photo-credits" className={styles.creditList}>
            {photos.map((p) => (
              <li key={p.src}>
                {p.name_ko} —{' '}
                {/* 토스 미니앱은 토스 밖 사이트로 이동할 수 없어(출시 체크리스트) 출처를 글자로만 표시한다 */}
                {p.source_page && !IS_TOSS ? (
                  <a href={p.source_page} target="_blank" rel="noreferrer">
                    {creditLine(p)}
                  </a>
                ) : (
                  creditLine(p)
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </Screen>
  )
}
