// 스크립트에서 쓰는 움직임 값 (시간·곡선은 styles/motion.css)

/** 04 로딩 한 단계 시간(ms). 피그마에 없는 값 */
export const LOADING_STEP_MS = 800

/** 마우스 끌기: 이만큼(px) 움직여야 끌기로 본다. 그보다 적으면 클릭 */
export const DRAG_THRESHOLD = 5

/** 마우스 끌기를 놓았을 때 속도 × 이 시간만큼 더 미끄러진다(ms) */
export const DRAG_MOMENTUM_MS = 160

export const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** CSS 시간 값 → ms. 배포용 빌드는 '1000ms'를 '1s'로 줄여 쓰므로 단위를 꼭 본다 */
export const cssTimeMs = (value: string) => {
  const v = value.trim()
  const n = parseFloat(v)
  return v.endsWith('ms') ? n : v.endsWith('s') ? n * 1000 : n
}
