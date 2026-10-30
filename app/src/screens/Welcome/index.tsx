// 01 온보딩 (/welcome). 처음 방문자만 본다.
// 실제 휴대폰은 피그마(812)보다 짧다: 짧으면 ① 문구·버튼 간격을 줄이고 ② 그림을 위로 올리고(CSS)
// ③ 그래도 넘치는 아주 짧은 화면(아이폰 SE 사파리 등)은 그림을 줄여서, 스크롤 없이 버튼까지 한 화면에 들어오게 한다.
import { useLayoutEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/Button'
import { IDCard } from '../../components/IDCard'
import { IDCardBack } from '../../components/IDCardBack'
import { Lanyard } from '../../components/Lanyard'
import { copy } from '../../copy'
import { visits } from '../../store/visits'
import { paths } from '../links'
import { Screen } from '../Screen'
import styles from './Welcome.module.css'

/** 그림을 이보다 작게 줄이지는 않는다 (카드 글자가 읽히는 정도) */
const MIN_STAGE_ZOOM = 0.7

export default function Welcome() {
  const navigate = useNavigate()
  const stage = useRef<HTMLDivElement>(null)

  // ③ 넘치는 만큼 그림(화면에 보이는 부분)의 배율을 낮춘다
  useLayoutEffect(() => {
    const el = stage.current
    if (!el) return
    const fit = () => {
      el.style.removeProperty('zoom')
      const over = document.documentElement.scrollHeight - window.innerHeight
      if (over <= 0) return
      const visible = el.getBoundingClientRect().height + parseFloat(getComputedStyle(el).marginTop)
      el.style.zoom = String(Math.max(MIN_STAGE_ZOOM, 1 - over / visible))
    }
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [])

  return (
    <Screen theme="Dark" className={styles.screen}>
      <div className={styles.stage} ref={stage} aria-hidden>
        <div className={styles.back}>
          <IDCardBack 정보="숨김" />
        </div>
        <div className={styles.lanyard}>
          <Lanyard theme="Dark" length="Short" />
        </div>
        <div className={styles.card}>
          <IDCard state="검사중" />
        </div>
      </div>
      <h1 className={styles.headline}>{copy.welcome.headline}</h1>
      <p className={styles.sub}>{copy.welcome.sub}</p>
      <div className={styles.spacer} />
      {/* 그래도 넘치면 버튼을 화면 아래에 붙여 스크롤 없이 누를 수 있게 */}
      <div className={styles.cta}>
        <Button
          variant="White"
          onClick={() => {
            visits.finishOnboarding()
            navigate(paths.main, { replace: true })
          }}
        >
          {copy.welcome.start}
        </Button>
      </div>
    </Screen>
  )
}
