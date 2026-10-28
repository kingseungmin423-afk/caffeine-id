// 피그마 DailyRatio (Type=확정·추정). 하루 권고량 대비 비율 + 막대 + 출처.
// 막대 길이는 비율(0~1)로 받는다. 확정은 0부터 채움, 추정은 from~to 범위.
import { copy } from '../../copy'
import styles from './DailyRatio.module.css'

type Props =
  | { type: '확정'; valueLabel: string; ratio: number; source: string; /** 출처 아래 한 줄 (사진 출처 등, 피그마에 없음: 출처와 같은 스타일) */ credit?: string }
  | { type: '추정'; valueLabel: string; from: number; to: number; note?: string }

const pct = (r: number) => `${Math.min(Math.max(r, 0), 1) * 100}%`

export function DailyRatio(props: Props) {
  const bar =
    props.type === '확정'
      ? { left: '0%', width: pct(props.ratio) }
      : { left: pct(props.from), width: `calc(${pct(props.to)} - ${pct(props.from)})` }
  return (
    <div className={styles.root}>
      <div className={styles.ratio}>
        <div className={styles.row}>
          <span className={styles.label}>{copy.dailyRatio.label}</span>
          <span className={styles.value}>{props.valueLabel}</span>
        </div>
        <div className={styles.progress}>
          <div className={styles.fill} style={bar} />
        </div>
      </div>
      <p className={styles.source}>
        {props.type === '확정' ? copy.dailyRatio.source(props.source) : (props.note ?? copy.dailyRatio.estimateNote)}
        {props.type === '확정' && props.credit && (
          <>
            <br />
            {props.credit}
          </>
        )}
      </p>
    </div>
  )
}
