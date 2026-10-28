// 피그마 LoadingStep (상태=완료·진행중·대기). 04 로딩 3단계 체크 한 줄.
import { copy } from '../../copy'
import { cx } from '../cx'
import { Icon } from '../Icon'
import styles from './LoadingStep.module.css'

type 상태 = '완료' | '진행중' | '대기'

export function LoadingStep({ 상태, label }: { 상태: 상태; label: string }) {
  return (
    <div className={cx(styles.root, styles[상태])}>
      <span className={styles.group}>
        {상태 === '완료' ? (
          <Icon name="check-circle" className={styles.check} />
        ) : (
          <span className={styles.status}>
            <span className={styles.ring} />
            {상태 === '진행중' && <span className={styles.dot} />}
          </span>
        )}
        <span className={styles.label}>{label}</span>
      </span>
      <span className={styles.state}>{copy.loadingStep[상태]}</span>
    </div>
  )
}
