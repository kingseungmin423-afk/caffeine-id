// 02 메인 (/). 검색, 카테고리, 최근 조회(기기 저장), TOP 5(미리 고른 목록), 오늘의 비교 퀴즈(날마다 자동).
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CategoryItem } from '../../components/CategoryItem'
import { FoodRow } from '../../components/FoodRow'
import { QuizOption } from '../../components/QuizOption'
import { RankRow } from '../../components/RankRow'
import { SearchField } from '../../components/SearchField'
import { SectionHeader } from '../../components/SectionHeader'
import { copy } from '../../copy'
import { CATEGORIES } from '../../data/categories'
import { findItem, metaLabel, mgLabel, servingLabel, useDb, type Item } from '../../data/db'
import { TOP5 } from '../../data/featured'
import { photoFor } from '../../data/photos'
import { dailyQuiz, quizName, today, withAnd } from '../../data/quiz'
import { readPick, savePick } from '../../store/quiz'
import { useVisits } from '../../store/visits'
import { paths } from '../links'
import { IS_TOSS } from '../../config/target'
import { InstallPrompt } from '../InstallPrompt'
import { Screen } from '../Screen'
import { useOpenItem } from '../useOpenItem'
import styles from './Main.module.css'

const RECENT_COUNT = 3

export default function Main() {
  const navigate = useNavigate()
  const open = useOpenItem()
  const items = useDb()
  const { recent } = useVisits()
  const date = today()
  const quiz = useMemo(() => (items ? dailyQuiz(items, date) : null), [items, date])
  // 오늘 이미 골랐으면 그 결과를 그대로 보여 준다
  const [quizPick, setQuizPick] = useState(() => readPick(date))
  const pick = (p: 'a' | 'b') => {
    if (quizPick) return
    setQuizPick(p)
    savePick(date, p)
  }

  const get = (id: string) => (items ? findItem(items, id) : null)
  const recentItems = recent.map(get).filter((i): i is Item => !!i).slice(0, RECENT_COUNT)
  const top = TOP5.map(get).filter((i): i is Item => !!i)
  // 정답: 카페인이 더 많은 쪽 (같으면 둘 다 정답)
  const answer = (p: 'a' | 'b') => {
    if (!quiz) return false
    const [mine, other] = p === 'a' ? [quiz.a, quiz.b] : [quiz.b, quiz.a]
    return mine.mg >= other.mg
  }
  const resultOf = (p: 'a' | 'b') => (quizPick === p ? (answer(p) ? '정답' : '오답') : undefined)

  return (
    <Screen theme="Light" tab="홈" className={styles.screen}>
      <h1 className={styles.headline}>{copy.main.headline}</h1>
      <p className={styles.sub}>{copy.main.sub}</p>
      <div className={styles.search}>
        <SearchField value="" readOnly onFocus={() => navigate(paths.search())} />
      </div>

      <div className={styles.categoryHeader}>
        <SectionHeader theme="Light" title={copy.main.category} onMore={() => navigate(paths.category)} />
      </div>
      <div className={styles.categoryRow}>
        {CATEGORIES.map((c) => (
          <CategoryItem key={c} category={c} onClick={() => navigate(paths.categoryDetail(c))} />
        ))}
      </div>

      <div className={styles.recentHeader}>
        <SectionHeader theme="Light" title={copy.main.recent} />
      </div>
      <div className={styles.recentList}>
        {recentItems.length ? (
          recentItems.map((i) => (
            <FoodRow
              key={i.id}
              상태="조회"
              name={i.name}
              meta={metaLabel(i)}
              amount={mgLabel(i.mg)}
              hasCaffeine={i.caffeine}
              photoSrc={photoFor(i.id)?.src}
              onClick={() => open(i.id)}
            />
          ))
        ) : (
          <p className={styles.empty}>{copy.main.recentEmpty}</p>
        )}
      </div>

      <div className={styles.topHeader}>
        <SectionHeader theme="Light" title={copy.main.top5} />
      </div>
      <div className={styles.topCard}>
        {top.map((i, n) => (
          <RankRow
            key={i.id}
            rank={n + 1}
            highlight={n === 0}
            name={i.name}
            meta={metaLabel(i)}
            amount={mgLabel(i.mg)}
            photoSrc={photoFor(i.id)?.src}
            onClick={() => open(i.id)}
          />
        ))}
      </div>

      {quiz && (
        <section className={styles.quiz}>
          <div className={styles.quizTitle}>
            <p className={styles.quizLabel}>{copy.main.quizLabel}</p>
            <h2 className={styles.quizQuestion}>{copy.main.quizQuestion(withAnd(quizName(quiz.a)), quizName(quiz.b))}</h2>
          </div>
          <div className={styles.options}>
            <div className={styles.option}>
              <QuizOption name={quizName(quiz.a)} sub={servingLabel(quiz.a.serving)} photoSrc={photoFor(quiz.a.id)?.src} result={resultOf('a')} onClick={() => pick('a')} />
            </div>
            <span className={styles.vs}>{copy.main.quizVs}</span>
            <div className={styles.option}>
              <QuizOption name={quizName(quiz.b)} sub={servingLabel(quiz.b.serving)} photoSrc={photoFor(quiz.b.id)?.src} result={resultOf('b')} onClick={() => pick('b')} />
            </div>
          </div>
          <p className={quizPick ? styles.quizResult : styles.quizHint} aria-live="polite">
            {quizPick
              ? copy.main.quizResult(answer(quizPick), quizName(quiz.a.mg >= quiz.b.mg ? quiz.a : quiz.b), mgLabel(Math.abs(quiz.a.mg - quiz.b.mg)))
              : copy.main.quizHint}
          </p>
        </section>
      )}
      {!IS_TOSS && <InstallPrompt />}
    </Screen>
  )
}
