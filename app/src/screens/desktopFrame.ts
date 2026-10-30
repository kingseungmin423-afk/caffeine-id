// PC(마우스를 쓰는 넓은 화면)에서는 앱을 가운데 375 폭 화면으로 두고 양옆은 회색으로 구분한다 (사용자 요청, 피그마에 없음).
// 화면 높이에 맞춰 피그마 한 화면(01 온보딩 375×812)이 한눈에 들어오도록 키운다. 배율 상한은 MAX_ZOOM.
// html에 data-frame과 --app-zoom을 달면 나머지는 CSS(base.css, Screen.module.css)가 처리한다.
const MAX_ZOOM = 1.5
const desktop = window.matchMedia('(hover: hover) and (pointer: fine)')

function update() {
  const html = document.documentElement
  const cs = getComputedStyle(html)
  const w = parseFloat(cs.getPropertyValue('--m-screen-main-w'))
  const h = parseFloat(cs.getPropertyValue('--m-screen-welcome-h'))
  // 양옆에 회색이 보일 만큼 넓을 때만
  const on = desktop.matches && window.innerWidth > w * 1.5
  html.toggleAttribute('data-frame', on)
  const zoom = on ? Math.min(MAX_ZOOM, Math.max(1, window.innerHeight / h)) : 1
  html.style.setProperty('--app-zoom', String(Math.round(zoom * 100) / 100))
}

export function startDesktopFrame() {
  update()
  window.addEventListener('resize', update)
  desktop.addEventListener('change', update)
}
