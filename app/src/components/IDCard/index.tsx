// 피그마 IDCard (State=확인·검사중·추정). 신분증 앞면 213×338.
import { copy } from '../../copy'
import { cx } from '../cx'
import { DashedOutline } from '../DashedOutline'
import styles from './IDCard.module.css'
import type { Category } from '../../data/categories'
import { PhotoFallback } from '../Icon'

export type IDCardProps =
  | {
      state: '확인'
      name: string
      meta: string
      serial: string
      /** 예: '34mg' */
      amount: string
      /** 예: '0.26잔' */
      coffeeCups: string
      /** false면 도장이 '없음' (피그마에 없는 상태: 같은 도장에 status/safe 색) */
      hasCaffeine?: boolean
      photoSrc?: string
      /** 사진이 없을 때 대신 보일 분류 아이콘 */
      photoFallback?: Category | null
      className?: string
    }
  | { state: '검사중'; className?: string }
  | {
      state: '추정'
      name: string
      meta: string
      /** 예: '10–20mg' */
      amountRange: string
      /** 예: '2건' */
      basis: string
      className?: string
    }

export function IDCard(props: IDCardProps) {
  const { state } = props
  return (
    <article className={cx(styles.root, styles[state], state === '확인' && props.hasCaffeine === false && styles.none, props.className)}>
      {state === '추정' && <DashedOutline className={styles.dashCard} />}
      <div className={styles.handle}>
        <span className={styles.bar} />
      </div>

      <div className={styles.titleRow}>
        <div className={styles.title}>
          <span className={styles.titleText}>{copy.idCard.title}</span>
          <span className={styles.idMark}>
            <span className={styles.idText}>{copy.idCard.idMark}</span>
          </span>
        </div>
        {state === '추정' && <span className={styles.temporary}>{copy.idCard.temporary}</span>}
      </div>

      <div className={styles.illustBox}>
        {state === '확인' && (props.photoSrc ? <img src={props.photoSrc} alt="" className={styles.photo} /> : <PhotoFallback category={props.photoFallback} />)}
        {state === '추정' && <DashedOutline className={styles.dashBox} />}
      </div>

      {state === '검사중' ? (
        <>
          <div className={cx(styles.info, styles.skeletonInfo)}>
            <span className={styles.skName} />
            <div className={styles.metaRow}>
              <span className={styles.skMeta} />
              <span className={styles.meta}>{copy.idCard.serial(1)}</span>
            </div>
          </div>
          <div className={styles.stats}>
            <div className={cx(styles.stat, styles.stat1, styles.skeletonStat)}>
              <span className={styles.skLabel} />
              <span className={styles.skValue1} />
            </div>
            <div className={cx(styles.stat, styles.stat2, styles.skeletonStat)}>
              <span className={styles.skLabel} />
              <span className={styles.skValue2} />
            </div>
          </div>
        </>
      ) : (
        <>
          <div className={styles.info}>
            <h2 className={styles.name}>{props.name}</h2>
            <div className={styles.metaRow}>
              <span className={styles.meta}>{props.meta}</span>
              <span className={styles.meta}>{state === '확인' ? props.serial : copy.idCard.unregistered}</span>
            </div>
          </div>
          <div className={styles.stats}>
            <div className={cx(styles.stat, styles.stat1)}>
              <span className={styles.label}>{state === '확인' ? copy.idCard.caffeineAmount : copy.idCard.estimateAmount}</span>
              <span className={styles.value}>{state === '확인' ? props.amount : props.amountRange}</span>
            </div>
            <div className={cx(styles.stat, styles.stat2)}>
              <span className={styles.label}>{state === '확인' ? copy.idCard.coffeeCups : copy.idCard.estimateBasis}</span>
              <span className={styles.value}>{state === '확인' ? props.coffeeCups : props.basis}</span>
            </div>
          </div>
          <div className={styles.stamp}>
            {state === '추정' && <DashedOutline className={styles.dashStamp} />}
            <span className={styles.innerRing}>{state === '추정' && <DashedOutline className={styles.dashInner} />}</span>
            <span className={styles.stampLabel}>{state === '확인' ? (props.hasCaffeine === false ? copy.stamp.none : copy.stamp.caffeine) : copy.stamp.estimate}</span>
          </div>
        </>
      )}

      {state === '추정' && <span className={styles.photoUnknown}>{copy.idCard.unknownPhoto}</span>}
    </article>
  )
}
