// 07 추정 결과 (임시 출입증, /estimate?q=). DB에 없으면 비슷한 음식 값으로 범위를 보여 준다.
import { Fragment, useMemo } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { BackHeader } from '../../components/BackHeader'
import { Button } from '../../components/Button'
import { DailyRatio } from '../../components/DailyRatio'
import { EvidenceRow } from '../../components/EvidenceRow'
import { IDCard } from '../../components/IDCard'
import { Lanyard } from '../../components/Lanyard'
import { copy } from '../../copy'
import { dailyRatio } from '../../data/calc'
import { mgLabel, similarItems, useDb } from '../../data/db'
import { photoFor } from '../../data/photos'
import { paths } from '../links'
import { Screen } from '../Screen'
import { useBack } from '../useBack'
import { useOpenItem } from '../useOpenItem'
import styles from './Estimate.module.css'

export default function Estimate() {
  const [params] = useSearchParams()
  const q = (params.get('q') ?? '').trim()
  const items = useDb()
  const back = useBack()
  const navigate = useNavigate()
  const open = useOpenItem()
  const similar = useMemo(() => (items ? similarItems(items, q) : []), [items, q])

  if (!q) return <Navigate to={paths.search()} replace />
  if (!items) return <Screen theme="Dark">{null}</Screen>

  const mgs = similar.map((s) => s.mg)
  const min = Math.min(...mgs)
  const max = Math.max(...mgs)
  const found = similar.length > 0
  // 대표 분류: 비슷한 음식 중 가장 많은 앱 카테고리
  const category = found
    ? [...similar.reduce((m, s) => m.set(s.app ?? s.category, (m.get(s.app ?? s.category) ?? 0) + 1), new Map<string, number>())].sort((a, b) => b[1] - a[1])[0][0]
    : copy.report.other
  const pct = (mg: number) => copy.result.percent(dailyRatio(mg) * 100)

  return (
    <Screen theme="Dark" tab="조회" className={styles.screen}>
      <div className={styles.stage}>
        <div className={styles.header}>
          <BackHeader theme="Dark" title={copy.estimate.title} onBack={back} />
        </div>
        <div className={styles.lanyard} aria-hidden>
          <Lanyard theme="Visitor" length="Long" />
        </div>
        <div className={styles.card}>
          <IDCard
            state="추정"
            name={q}
            meta={category}
            amountRange={found ? copy.estimate.mgRange(mgLabel(min), mgLabel(max)) : copy.idCard.unknownAmount}
            basis={copy.estimate.basisCount(similar.length)}
          />
        </div>
      </div>
      <p className={styles.caption}>{found ? copy.estimate.caption : copy.estimate.noMatch}</p>

      {found && (
        <>
          <h2 className={styles.infoTitle}>{copy.estimate.info}</h2>
          <div className={styles.ratio}>
            <DailyRatio type="추정" valueLabel={copy.estimate.percentRange(pct(min), pct(max))} from={dailyRatio(min)} to={dailyRatio(max)} />
          </div>
          <h2 className={styles.basisTitle}>{copy.estimate.basis}</h2>
          <div className={styles.similar}>
            {similar.map((s, i) => (
              <Fragment key={s.id}>
                {i > 0 && <hr className={styles.divider} />}
                <EvidenceRow name={s.name} amount={mgLabel(s.mg)} photoSrc={photoFor(s.id)?.src} onClick={() => open(s.id)} />
              </Fragment>
            ))}
          </div>
        </>
      )}
      <div className={found ? styles.register : styles.registerAlone}>
        <Button variant="White" onClick={() => navigate(paths.report(q))}>
          {copy.estimate.register}
        </Button>
      </div>
    </Screen>
  )
}
