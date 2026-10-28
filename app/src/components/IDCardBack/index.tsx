// 피그마 IDCardBack (정보=표시·숨김). 표시=06 결과 뒷면, 숨김=앞면 뒤에 겹쳐 보이는 빈 뒷면.
import { Fragment } from 'react'
import { copy } from '../../copy'
import { cx } from '../cx'
import styles from './IDCardBack.module.css'

export type IDCardBackInfo = { serving: string; caffeine: string; per100ml: string; issuer: string }

type Props = { 정보: '표시'; info: IDCardBackInfo; className?: string } | { 정보: '숨김'; className?: string }

export function IDCardBack(props: Props) {
  const rows =
    props.정보 === '표시'
      ? [
          [copy.idCardBack.serving, props.info.serving],
          [copy.idCardBack.caffeine, props.info.caffeine],
          [copy.idCardBack.per100ml, props.info.per100ml],
          [copy.idCardBack.issuer, props.info.issuer],
        ]
      : []
  return (
    <article className={cx(styles.root, styles[props.정보], props.className)}>
      <span className={styles.handle} />
      <span className={styles.verticalTitle}>{copy.idCardBack.title}</span>
      {props.정보 === '표시' && (
        <dl className={styles.info}>
          {rows.map(([label, value], i) => (
            <Fragment key={label}>
              {i > 0 && <hr className={styles.divider} />}
              <div className={styles.row}>
                <dt className={styles.label}>{label}</dt>
                <dd className={styles.value}>{value}</dd>
              </div>
            </Fragment>
          ))}
        </dl>
      )}
    </article>
  )
}
