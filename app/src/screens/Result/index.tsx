// 05·06 결과 (/item/:id). 카드를 탭하면 앞 카드가 뒤로 넘어가고 뒤 카드가 앞으로 온다 (CardDeck).
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { BackHeader } from '../../components/BackHeader'
import { DailyRatio } from '../../components/DailyRatio'
import { IDCard } from '../../components/IDCard'
import { Icon } from '../../components/Icon'
import { IDCardBack } from '../../components/IDCardBack'
import { Lanyard } from '../../components/Lanyard'
import { RelatedCard } from '../../components/RelatedCard'
import { SectionHeader } from '../../components/SectionHeader'
import { COFFEE_REFERENCE } from '../../config/caffeine'
import { useDragScroll } from '../../components/useDragScroll'
import { copy } from '../../copy'
import { coffeeCups, coffeeRatio, dailyRatio } from '../../data/calc'
import { findItem, metaLabel, mgLabel, per100, servingLabel, useDb } from '../../data/db'
import { issuer } from '../../data/issuer'
import { creditLine, photoFor } from '../../data/photos'
import { bookmarks, useBookmarks } from '../../store/bookmarks'
import { recordView } from '../../store/views'
import { useVisits, visits } from '../../store/visits'
import { paths } from '../links'
import { Screen } from '../Screen'
import { useBack } from '../useBack'
import { useOpenItem } from '../useOpenItem'
import { CardDeck } from './CardDeck'
import styles from './Result.module.css'

const RELATED_COUNT = 4

export default function Result() {
  const { id = '' } = useParams()
  const items = useDb()
  const { issued } = useVisits()
  const marked = useBookmarks()
  const back = useBack()
  const navigate = useNavigate()
  const open = useOpenItem()
  const [flipped, setFlipped] = useState(false)
  const relatedRef = useDragScroll<HTMLDivElement>()
  const item = items ? findItem(items, id) : null

  // 결과를 보면 발급(조회 기록)
  useEffect(() => {
    if (!item) return
    visits.view(item.id)
    // '많이 찾는 순' 정렬용 전체 조회 수
    recordView(item.id)
  }, [item])
  useEffect(() => {
    setFlipped(false)
  }, [id])

  const related = useMemo(() => {
    if (!items || !item?.app) return []
    const same = items.filter((i) => i.app === item.app && i.id !== item.id)
    // 사진이 있는 음식 → 조회한 음식 → 나머지 순
    const rank = (i: (typeof same)[number]) => (photoFor(i.id) ? 0 : 2) + (i.id in visits.get().issued ? 0 : 1)
    return same.sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name, 'ko')).slice(0, RELATED_COUNT)
  }, [items, item])

  if (!items) return <Screen theme="Dark">{null}</Screen>
  if (!item) {
    return (
      <Screen theme="Dark" tab="조회" className={styles.screen}>
        <div className={styles.header}>
          <BackHeader theme="Dark" title={copy.result.title} onBack={back} />
        </div>
        <p className={styles.notFound}>{copy.result.notFound}</p>
      </Screen>
    )
  }

  const photo = photoFor(item.id)
  const serial = copy.idCard.serial(issued[item.id] ?? Object.keys(issued).length + 1)
  const front = (
    <IDCard
      state="확인"
      name={item.name}
      meta={metaLabel(item)}
      serial={serial}
      amount={mgLabel(item.mg)}
      coffeeCups={copy.result.coffeeCups(coffeeCups(item.mg))}
      hasCaffeine={item.caffeine}
      photoSrc={photo?.src}
      photoFallback={item.app}
    />
  )
  const backCard = (
    <IDCardBack
      정보="표시"
      info={{ serving: servingLabel(item.serving) || '—', caffeine: mgLabel(item.mg), per100ml: per100(item) ?? '—', issuer: issuer(item) }}
    />
  )
  const ratio = dailyRatio(item.mg)

  return (
    <Screen theme="Dark" tab="조회" className={styles.screen} meta={copy.seo.item(item.name, mgLabel(item.mg), coffeeCups(item.mg))}>
      <div className={styles.stage}>
        <div className={styles.header}>
          <BackHeader theme="Dark" title={copy.result.title} onBack={back} />
        </div>
        {/* 북마크: 뒤로가기 화살표와 좌우 대칭 자리 (피그마에 없음, 사용자 요청) */}
        <button
          type="button"
          className={styles.bookmark}
          aria-pressed={marked.includes(item.id)}
          aria-label={marked.includes(item.id) ? copy.result.bookmarkRemove : copy.result.bookmarkAdd}
          onClick={() => bookmarks.toggle(item.id)}
        >
          <Icon name={marked.includes(item.id) ? 'bookmark-fill' : 'bookmark'} className={styles.bookmarkIcon} />
        </button>
        <CardDeck
          front={front}
          back={backCard}
          backCover={<IDCardBack 정보="숨김" />}
          // 목줄은 두 카드 사이에 걸린다. 앞뒤와 상관없이 밝은 파랑(Dark) 고정 (사용자 요청)
          lanyard={<Lanyard theme="Dark" length="Long" />}
          flipped={flipped}
          onFlip={() => setFlipped((f) => !f)}
        />
      </div>
      <p className={styles.caption}>{flipped ? copy.result.tapToFront : copy.result.tapToBack}</p>

      <h2 className={styles.infoTitle}>{copy.result.info}</h2>
      <p className={styles.summary}>{copy.result.summary(item.name, COFFEE_REFERENCE.label, item.caffeine ? coffeeRatio(item.mg) : 0)}</p>
      <div className={styles.ratio}>
        <DailyRatio
          type="확정"
          valueLabel={copy.result.percent(ratio * 100)}
          ratio={ratio}
          source={issuer(item)}
          credit={photo ? `${copy.result.photoCredit} · ${creditLine(photo)}` : undefined}
        />
      </div>

      {related.length > 0 && item.app && (
        <>
          <div className={styles.relatedHeader}>
            <SectionHeader theme="Dark" title={copy.result.related} onMore={() => navigate(paths.categoryDetail(item.app!))} />
          </div>
          <div className={styles.related} ref={relatedRef}>
            {related.map((r) =>
              r.id in issued ? (
                <RelatedCard key={r.id} 상태="조회" category={r.app ?? r.category} name={r.name} amount={mgLabel(r.mg)} photoSrc={photoFor(r.id)?.src} photoFallback={r.app} onClick={() => open(r.id)} />
              ) : (
                <RelatedCard key={r.id} 상태="미조회" category={r.app ?? r.category} name={r.name} onClick={() => open(r.id)} />
              ),
            )}
          </div>
        </>
      )}
    </Screen>
  )
}
