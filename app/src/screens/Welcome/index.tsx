// 01 온보딩 (/welcome). 처음 방문자만 본다.
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

export default function Welcome() {
  const navigate = useNavigate()
  return (
    <Screen theme="Dark" className={styles.screen}>
      <div className={styles.stage} aria-hidden>
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
      <Button
        variant="White"
        onClick={() => {
          visits.finishOnboarding()
          navigate(paths.main, { replace: true })
        }}
      >
        {copy.welcome.start}
      </Button>
    </Screen>
  )
}
