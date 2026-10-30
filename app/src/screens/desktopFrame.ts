// PC(마우스를 쓰는 넓은 화면)에서는 앱을 가운데 375 폭 화면으로 두고 양옆은 회색으로 구분한다 (사용자 요청, 피그마에 없음).
// 화면 높이에 맞춰 피그마 한 화면(01 온보딩 375×812)이 한눈에 들어오도록 키운다. 배율 상한은 MAX_ZOOM.
// html에 data-frame과 --app-zoom을 달면 나머지는 CSS(base.css, Screen.module.css)가 처리한다.
const MAX_ZOOM = 1.5
const desktop = window.matchMedia('(hover: hover) and (pointer: fine)')

// 테스트용(로컬 개발 서버에서만, 배포본에서는 빠진다): 주소에 ?zoom=2.5 처럼 붙이면 PC 화면에서 그 배율로 고정(1~3배).
// 처음 연 주소에서 한 번만 읽는다
const TEST_ZOOM_RANGE = [1, 3] as const
const testZoom = (() => {
  if (!import.meta.env.DEV) return null
  const v = parseFloat(new URLSearchParams(window.location.search).get('zoom') ?? '')
  return Number.isFinite(v) ? Math.min(TEST_ZOOM_RANGE[1], Math.max(TEST_ZOOM_RANGE[0], v)) : null
})()

function update() {
  const html = document.documentElement
  const cs = getComputedStyle(html)
  const w = parseFloat(cs.getPropertyValue('--m-screen-main-w'))
  const h = parseFloat(cs.getPropertyValue('--m-screen-welcome-h'))
  // 양옆에 회색이 보일 만큼 넓을 때만
  const on = desktop.matches && window.innerWidth > w * 1.5
  html.toggleAttribute('data-frame', on)
  const zoom = !on ? 1 : (testZoom ?? Math.min(MAX_ZOOM, Math.max(1, window.innerHeight / h)))
  html.style.setProperty('--app-zoom', String(Math.round(zoom * 100) / 100))
}

export function startDesktopFrame() {
  update()
  window.addEventListener('resize', update)
  desktop.addEventListener('change', update)
}
