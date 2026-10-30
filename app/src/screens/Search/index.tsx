// 03 검색 (/search?q=). 띄어쓰기 무시, 별칭(아아·스벅 등) 포함. 안 본 음식은 ??mg로 가린다.
import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Chip } from '../../components/Chip'
import { FoodRow } from '../../components/FoodRow'
import { Icon } from '../../components/Icon'
import { SearchField } from '../../components/SearchField'
import { copy } from '../../copy'
import { CATEGORIES } from '../../data/categories'
import { metaLabel, mgLabel, search, useDb } from '../../data/db'
import { useDragScroll } from '../../components/useDragScroll'
import { photoFor } from '../../data/photos'
import { useVisits } from '../../store/visits'
import { paths } from '../links'
import { Screen } from '../Screen'
import { useBack } from '../useBack'
import { useOpenItem } from '../useOpenItem'
import styles from './Search.module.css'

const LIMIT = 50
const OTHER = copy.report.other

export default function Search() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const items = useDb()
  const chipsRef = useDragScroll<HTMLDivElement>()
  const { issued } = useVisits()
  const navigate = useNavigate()
  const back = useBack()
  const open = useOpenItem()
  const [filter, setFilter] = useState<string | null>(null)

  const results = useMemo(() => (items ? search(items, q) : []), [items, q])
  const groups = useMemo(() => {
    const count = new Map<string, number>()
    for (const r of results) count.set(r.app ?? OTHER, (count.get(r.app ?? OTHER) ?? 0) + 1)
    return [...CATEGORIES, OTHER].filter((c) => count.has(c)).map((c) => ({ c, n: count.get(c)! }))
  }, [results])
  const shown = filter ? results.filter((r) => (r.app ?? OTHER) === filter) : results

  const setQuery = (v: string) => {
    setFilter(null)
    setParams(v ? { q: v } : {}, { replace: true })
  }

  return (
    <Screen theme="Light" tab="조회" className={styles.screen} meta={copy.seo.search(q)}>
      <form
        className={styles.top}
        role="search"
        onSubmit={(e) => {
          e.preventDefault()
          ;(document.activeElement as HTMLElement | null)?.blur()
          if (items && q.trim() && !results.length) navigate(paths.check(paths.estimate(q.trim())))
        }}
      >
        <button type="button" className={styles.back} onClick={back} aria-label={copy.backHeader.back}>
          <Icon name="chevron-left" className={styles.backIcon} />
        </button>
        <SearchField value={q} onChange={(e) => setQuery(e.target.value)} autoFocus />
      </form>

      {q && results.length > 0 && (
        <>
          <div className={styles.chips} ref={chipsRef}>
            <Chip selected={filter === null} onClick={() => setFilter(null)}>
              {copy.search.all(results.length)}
            </Chip>
            {groups.map(({ c, n }) => (
              <Chip key={c} selected={filter === c} onClick={() => setFilter((cur) => (cur === c ? null : c))}>
                {copy.search.chip(c, n)}
              </Chip>
            ))}
          </div>
          <div className={styles.header}>
            <span className={styles.count}>{copy.search.resultCount(shown.length)}</span>
            <span className={styles.sort}>{copy.search.sort}</span>
          </div>
          <div className={styles.list}>
            {shown.slice(0, LIMIT).map((i) =>
              i.id in issued ? (
                <FoodRow
                  key={i.id}
                  상태="조회"
                  name={i.name}
                  meta={metaLabel(i)}
                  amount={mgLabel(i.mg)}
                  hasCaffeine={i.caffeine}
                  photoSrc={photoFor(i.id)?.src}
                  photoFallback={i.app}
                  onClick={() => open(i.id)}
                />
              ) : (
                <FoodRow key={i.id} 상태="미조회" name={i.name} meta={metaLabel(i)} onClick={() => open(i.id)} />
              ),
            )}
          </div>
        </>
      )}

      {q && items && results.length === 0 && (
        <>
          <div className={styles.header}>
            <span className={styles.count}>{copy.search.resultCount(0)}</span>
          </div>
          <button type="button" className={styles.estimate} onClick={() => navigate(paths.check(paths.estimate(q.trim())))}>
            {copy.search.estimate(q.trim())}
          </button>
        </>
      )}

      {q && (
        <p className={styles.register}>
          <span className={styles.registerQuestion}>{copy.search.registerQuestion}</span>
          <Link to={paths.report(q.trim())} className={styles.registerLink}>
            {copy.search.registerLink}
          </Link>
        </p>
      )}
    </Screen>
  )
}
