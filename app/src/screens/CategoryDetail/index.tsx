// 02-2 카테고리 상세 (/category/:분류). 조회한 음식 = 발급 카드, 안 본 음식 = 미발급 카드 (정보 제4조).
import { useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { BackHeader } from '../../components/BackHeader'
import { Icon } from '../../components/Icon'
import { IDCardMini } from '../../components/IDCardMini'
import { copy } from '../../copy'
import { CATEGORIES, type Category } from '../../data/categories'
import { mgLabel, servingLabel, useDb } from '../../data/db'
import { photoFor } from '../../data/photos'
import { useViewCounts } from '../../store/views'
import { useVisits } from '../../store/visits'
import { paths } from '../links'
import { Screen } from '../Screen'
import { useBack } from '../useBack'
import { useOpenItem } from '../useOpenItem'
import styles from './CategoryDetail.module.css'

/** 한 번에 그리는 카드 수. 아래 끝에 가까워지면 더 그린다 (커피는 700장이 넘는다) */
const PAGE = 24

// 정렬: 가나다순 ↔ 많이 찾는 순 (전체 사용자 조회 수). 고른 정렬은 이번 방문 동안 기억한다
type Sort = 'name' | 'popular'
const SORT_KEY = 'caffeine-id:wallet-sort'
const readSort = (): Sort => {
  try {
    return sessionStorage.getItem(SORT_KEY) === 'popular' ? 'popular' : 'name'
  } catch {
    return 'name'
  }
}
const saveSort = (s: Sort) => {
  try {
    sessionStorage.setItem(SORT_KEY, s)
  } catch {
    // 저장이 막힌 환경: 이번 화면 동안만
  }
}

const shownKey = (c: string) => `caffeine-id:wallet:${c}`
const readShown = (c: string) => {
  try {
    return Number(sessionStorage.getItem(shownKey(c))) || PAGE
  } catch {
    return PAGE
  }
}
const saveShown = (c: string, n: number) => {
  try {
    sessionStorage.setItem(shownKey(c), String(n))
  } catch {
    // 저장이 막힌 환경: 이번 화면 동안만
  }
}

export default function CategoryDetail() {
  const { category = '' } = useParams()
  const items = useDb()
  const { issued } = useVisits()
  const back = useBack(paths.category)
  const open = useOpenItem()
  // 펼쳐 둔 카드 수는 카테고리마다 기억한다 (뒤로가기·조회 탭으로 돌아왔을 때 그대로)
  const [shown, setShown] = useState(() => readShown(category))
  useEffect(() => saveShown(category, shown), [category, shown])
  const sentinel = useRef<HTMLDivElement>(null)
  const [sort, setSort] = useState(readSort)
  useEffect(() => saveSort(sort), [sort])
  const views = useViewCounts()

  const list = useMemo(() => {
    const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name, 'ko')
    const inCategory = (items ?? []).filter((i) => i.app === category)
    // 많이 찾는 순: 조회 수가 같으면(또는 아직 못 받았으면) 가나다순
    const count = (id: string) => views?.get(id) ?? 0
    return inCategory.sort(sort === 'popular' ? (a, b) => count(b.id) - count(a.id) || byName(a, b) : byName)
  }, [items, category, sort, views])

  useEffect(() => {
    const el = sentinel.current
    if (!el) return
    const io = new IntersectionObserver((e) => e[0].isIntersecting && setShown((n) => n + PAGE), { rootMargin: '100%' })
    io.observe(el)
    return () => io.disconnect()
  }, [list.length])

  if (!CATEGORIES.includes(category as Category)) return <Navigate to={paths.category} replace />

  return (
    <Screen theme="Dark" tab="조회" className={styles.screen} meta={copy.seo.categoryDetail(category)}>
      <BackHeader theme="Dark" title={copy.categoryDetail.back} onBack={back} />
      <h1 className={styles.title}>{category}</h1>
      <p className={styles.sub}>{copy.categoryDetail.sub}</p>
      <div className={styles.meta}>
        <span className={styles.count}>{copy.categoryDetail.count(list.length)}</span>
        {/* 누를 때마다 정렬이 바뀐다 (피그마에는 '가나다순' 글자만 있어 같은 글자 스타일에 작은 화살표만 붙였다) */}
        <button
          type="button"
          className={styles.sort}
          aria-label={copy.categoryDetail.sortChange}
          onClick={() => setSort((s) => (s === 'name' ? 'popular' : 'name'))}
        >
          {sort === 'name' ? copy.categoryDetail.sort : copy.categoryDetail.sortPopular}
          <Icon name="chevron-left" className={styles.sortIcon} />
        </button>
      </div>
      <div className={styles.wallet}>
        {list.slice(0, shown).map((i) =>
          i.id in issued ? (
            <IDCardMini
              key={i.id}
              상태="발급"
              name={i.name}
              serving={servingLabel(i.serving)}
              serial={copy.idCard.serial(issued[i.id])}
              amount={mgLabel(i.mg)}
              photoSrc={photoFor(i.id)?.src}
              photoFallback={i.app}
              onClick={() => open(i.id)}
            />
          ) : (
            <IDCardMini key={i.id} 상태="미발급" name={i.name} serving={servingLabel(i.serving)} onClick={() => open(i.id)} />
          ),
        )}
      </div>
      {shown < list.length && <div ref={sentinel} />}
      <p className={styles.hint}>{copy.categoryDetail.hint}</p>
    </Screen>
  )
}
