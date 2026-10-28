// 04 로딩 (신분증 검사, /check?to=). 3단계를 차례로 체크한 뒤 결과 화면으로 넘어간다.
// 스캔선이 카드를 훑고, 단계가 끝날 때마다 체크가 튄다.
import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { IDCard } from '../../components/IDCard'
import { Lanyard } from '../../components/Lanyard'
import { LoadingStep } from '../../components/LoadingStep'
import { LOADING_STEP_MS } from '../../config/motion'
import { copy } from '../../copy'
import { isCheckTarget, paths } from '../links'
import { Screen } from '../Screen'
import styles from './Loading.module.css'

export default function Loading() {
  const [params] = useSearchParams()
  const to = params.get('to') ?? ''
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const valid = isCheckTarget(to)

  useEffect(() => {
    if (!valid) return
    if (step < copy.loading.steps.length) {
      const t = setTimeout(() => setStep((s) => s + 1), LOADING_STEP_MS)
      return () => clearTimeout(t)
    }
    navigate(to, { replace: true })
  }, [step, to, valid, navigate])

  if (!valid) return <Navigate to={paths.main} replace />
  const current = Math.min(step, copy.loading.steps.length - 1)

  return (
    <Screen theme="Dark" className={styles.screen}>
      <div className={styles.stage} aria-hidden>
        <div className={styles.lanyard}>
          <Lanyard theme="Dark" length="Short" />
        </div>
        <div className={styles.card}>
          <IDCard state="검사중" />
        </div>
        <div className={styles.frame}>
          <span className={styles.c1} />
          <span className={styles.c2} />
          <span className={styles.c3} />
          <span className={styles.c4} />
        </div>
        {/* 빛과 선은 한 덩어리로 움직인다 */}
        <div className={styles.scan}>
          <div className={styles.glow} />
          <div className={styles.line} />
        </div>
      </div>
      <p className={styles.stepLabel}>{copy.loading.stepLabel(current + 1)}</p>
      <h1 key={current} className={styles.headline} aria-live="polite">
        {copy.loading.headlines[current]}
      </h1>
      <div className={styles.steps}>
        {copy.loading.steps.map((label, i) => (
          <LoadingStep key={label} 상태={i < step ? '완료' : i === step ? '진행중' : '대기'} label={label} />
        ))}
      </div>
    </Screen>
  )
}
