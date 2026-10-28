// 05·06 신분증 두 장: 탭하면 앞 카드를 위쪽 가장자리(목줄 고리)를 축으로 입체로 넘겨 뒤로 보내고, 뒤 카드가 앞으로 온다.
// 탁상 달력을 넘기듯 앞 카드는 아래쪽이 들려 다가오다 위로 넘어가 사라지고, 뒤 카드 뒤로 내려앉는다.
// (피그마 flip 프레임 대신, 사용자 요청. 두 자리의 위치·기울기는 피그마 05 값 그대로)
// 앞뒤는 z-index로만 정하고, 3D는 들려서 다가오는 카드 하나에만 쓴다 (아이폰 WebKit은 3D로 움직이는 요소끼리 겹치면 순서가 꼬인다).
// 카드 요소는 그대로 두고 자리(앞·뒤) 클래스만 바꿔서, 움직임이 끝난 모습과 바뀐 자리가 정확히 이어진다.
import { useRef, type ReactNode } from 'react'
import { flushSync } from 'react-dom'
import { cssTimeMs, prefersReducedMotion } from '../../config/motion'
import { cx } from '../../components/cx'
import styles from './Result.module.css'

type Props = {
  /** 앞면(IDCard)·뒷면(IDCardBack) */
  front: ReactNode
  back: ReactNode
  /** 뒷면이 뒤에 있을 때 위에 덮는 정보 숨김 뒷면 (피그마 05의 뒤 카드). 앞으로 나오면서 서서히 걷힌다 */
  backCover: ReactNode
  /** 두 카드 사이에 걸리는 목줄 */
  lanyard: ReactNode
  /** true면 뒷면이 앞에 있다 (06) */
  flipped: boolean
  onFlip: () => void
}

// 원근(시점 거리, 카드 높이 대비). 작을수록 들릴 때 입체감이 세다
const PERSPECTIVE = 2.6
// 넘어가는 카드
// 1) 0 → LIFT_END: 위쪽 가장자리를 축으로 아래가 들려 다가오며 90°까지 넘어간다(옆에서 본 선이 됨). 3D는 이 구간뿐
// 2) LIFT_END → DROP_START: 안 보인다(투명). 이 사이에 앞뒤 겹침 순서를 바꾼다
// 3) DROP_START → 1: 넘어간 카드가 뒤 카드 뒤쪽 위에서 내려와 뒤 자리에 앉는다 (평면 움직임)
const LIFT_END = 0.4
const SWITCH = 0.46
const DROP_START = 0.52
const FADE_IN_END = 0.6
const DROP_FROM = 0.18 // 내려오기 시작하는 높이 (카드 높이 대비)
const DROP_TILT = 0.3 // 그때 기울기 (뒤 자리 기울기 대비)
// 앞으로 오는 카드: 앞 카드가 조금 들린 뒤 움직이기 시작한다
const RISE_START = 0.18
// 앞으로 나오는 뒷면의 덮개(정보 숨김)가 다 걷히는 시점
const UNCOVER_END = 0.75

const css = (el: Element, name: string) => getComputedStyle(el).getPropertyValue(name).trim()
const num = (el: Element, name: string) => parseFloat(css(el, name))

export function CardDeck({ front, back, backCover, lanyard, flipped, onFlip }: Props) {
  const deck = useRef<HTMLDivElement>(null)
  const frontRef = useRef<HTMLButtonElement>(null)
  const backRef = useRef<HTMLButtonElement>(null)
  const coverRef = useRef<HTMLDivElement>(null)
  const busy = useRef(false)

  const swap = () => {
    const d = deck.current
    const top = flipped ? backRef.current : frontRef.current
    const under = flipped ? frontRef.current : backRef.current
    if (!d || !top || !under || busy.current) return
    if (prefersReducedMotion()) return onFlip()
    busy.current = true

    // 피그마 05의 두 자리 (앞 81,108 / 뒤 83,140 기울기 -10°)
    const dx = num(d, '--m-screen-result-card-back-x') - num(d, '--m-screen-result-card-front-x')
    const dy = num(d, '--m-screen-result-card-back-y') - num(d, '--m-screen-result-card-front-y')
    const rot = num(d, '--m-screen-result-card-back-rotate')
    const duration = cssTimeMs(css(d, '--motion-card-swap'))
    const w = top.offsetWidth
    const h = top.offsetHeight
    const ease = (e: string) => css(d, e)
    const timing = { duration, fill: 'forwards' } as const
    // 평면 자리: 뒤 자리로 t만큼 옮긴 모습 (y는 추가로 올린 높이)
    const flat = (t: number, tilt = t, y = 0) => `translate(${dx * t}px, ${dy * t + y}px) rotate(${rot * tilt}deg)`
    // 들린 모습: 위쪽 가운데를 축으로 a만큼 넘김
    const lift = (a: number) => `translate(${w / 2}px, 0px) perspective(${h * PERSPECTIVE}px) rotateX(${a}deg) translate(${-w / 2}px, 0px)`
    const layer = (from: number, to: number) => [
      { offset: 0, zIndex: from },
      { offset: SWITCH, zIndex: from },
      { offset: SWITCH, zIndex: to },
      { offset: 1, zIndex: to },
    ]

    const cover = coverRef.current
    const anims = [
      top.animate(
        [
          { offset: 0, transform: lift(0), easing: ease('--ease-card-lift') },
          { offset: LIFT_END, transform: lift(90) },
          { offset: DROP_START, transform: flat(1, DROP_TILT, -h * DROP_FROM), easing: ease('--ease-card-drop') },
          { offset: 1, transform: flat(1) },
        ],
        timing,
      ),
      top.animate(
        [
          { offset: 0, opacity: 1 },
          { offset: LIFT_END, opacity: 1 },
          { offset: LIFT_END, opacity: 0 },
          { offset: DROP_START, opacity: 0 },
          { offset: FADE_IN_END, opacity: 1 },
          { offset: 1, opacity: 1 },
        ],
        timing,
      ),
      top.animate(layer(3, 1), timing),
      under.animate(
        [
          { offset: 0, transform: flat(1) },
          { offset: RISE_START, transform: flat(1), easing: ease('--ease-card-rise') },
          { offset: 1, transform: flat(0) },
        ],
        timing,
      ),
      under.animate(layer(1, 3), timing),
    ]
    // 뒷면이 앞으로 나올 때는 덮개가 걷히고, 뒤로 갈 때는 안 보이는 사이에 덮인다
    if (cover) {
      anims.push(
        flipped
          ? cover.animate([{ offset: 0, opacity: 0 }, { offset: LIFT_END, opacity: 0 }, { offset: LIFT_END, opacity: 1 }, { offset: 1, opacity: 1 }], timing)
          : cover.animate([{ offset: 0, opacity: 1 }, { offset: RISE_START, opacity: 1, easing: ease('--ease-screen') }, { offset: UNCOVER_END, opacity: 0 }, { offset: 1, opacity: 0 }], timing),
      )
    }

    // 움직이는 동안에는 화면을 다시 그리지 않는다(휴대폰에서 버벅임 방지). 끝나면 자리를 바꾸고 움직임을 걷어 낸다
    Promise.all(anims.map((a) => a.finished))
      .then(() => {
        flushSync(onFlip)
        anims.forEach((a) => a.cancel())
      })
      .catch(() => {})
      .finally(() => {
        busy.current = false
      })
  }

  return (
    <div className={styles.deck} ref={deck}>
      <button
        ref={backRef}
        type="button"
        className={cx(styles.slot, flipped ? styles.slotTop : styles.slotBehind)}
        onClick={swap}
        aria-hidden={!flipped}
        tabIndex={flipped ? 0 : -1}
      >
        {back}
        <div ref={coverRef} className={styles.cover} aria-hidden>
          {backCover}
        </div>
      </button>
      <div className={styles.lanyard} aria-hidden>
        {lanyard}
      </div>
      <button
        ref={frontRef}
        type="button"
        className={cx(styles.slot, flipped ? styles.slotBehind : styles.slotTop)}
        onClick={swap}
        aria-hidden={flipped}
        tabIndex={flipped ? -1 : 0}
      >
        {front}
      </button>
    </div>
  )
}
