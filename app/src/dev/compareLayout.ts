// 개발용: 갤러리에 그린 컴포넌트의 글자 위치를 피그마(figma-layout.json)와 비교한다.
// 브라우저 콘솔에서 compareLayout() 실행. 375px 화면에서 확인할 것.
// figma-layout.json: Components v2 각 변형의 크기와 글자 상자 [문구, x, y, w, h] (변형 왼쪽 위 기준)
import figma from './figma-layout.json'
import screens from './figma-screens.json'

type Entry = { w: number; h: number; t: [string, number, number, number, number][] }

const norm = (s: string) => s.replace(/\s+/g, ' ').trim()

const textRects = (root: Element) => {
  const out: [string, DOMRect][] = []
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  let n: Node | null
  while ((n = walker.nextNode())) {
    const t = norm(n.textContent ?? '')
    if (!t) continue
    const r = document.createRange()
    r.selectNodeContents(n)
    out.push([t, r.getBoundingClientRect()])
  }
  for (const inp of root.querySelectorAll('input')) {
    const b = inp.getBoundingClientRect()
    const pad = parseFloat(getComputedStyle(inp).paddingLeft)
    out.push([norm(inp.value || inp.placeholder), new DOMRect(b.x + pad, b.y, 0, b.height)])
  }
  return out
}

/**
 * 화면 비교: 지금 화면의 글자 위치를 피그마 화면(figma-screens.json, 화면 왼쪽 위 기준)과 비교한다.
 * 375px에서, 스크롤 맨 위에서 실행. 데이터가 다른 글자(음식 이름 등)는 '없음'으로 따로 모은다.
 */
export function compareScreen(key: keyof typeof screens, tolerance = 1.5) {
  const want = screens[key] as [string, number, number, number, number][]
  const nodes: [string, DOMRect][] = []
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  let n: Node | null
  while ((n = walker.nextNode())) {
    const t = norm(n.textContent ?? '')
    if (!t || !n.parentElement || n.parentElement.closest('nav')) continue
    const r = document.createRange()
    r.selectNodeContents(n)
    const b = r.getBoundingClientRect()
    if (b.width) nodes.push([t, b])
  }
  // 줄바꿈으로 나뉜 글자는 이어 붙여 찾는다
  const used = new Set<number>()
  const diffs: string[] = []
  const missing: string[] = []
  const col = (document.querySelector('main') as HTMLElement).getBoundingClientRect().left
  for (const [t, fx, fy, , fh] of want) {
    const idx = nodes.findIndex(([s], i) => !used.has(i) && (s === t || t.startsWith(s)))
    if (idx < 0) {
      missing.push(t)
      continue
    }
    used.add(idx)
    const b = nodes[idx][1]
    const dx = b.x - col - fx
    const dy = b.y + window.scrollY - fy - (t === nodes[idx][0] ? (fh - b.height) / 2 : 0)
    if (Math.abs(dx) > tolerance || Math.abs(dy) > tolerance) diffs.push(`"${t.slice(0, 20)}" dx${dx.toFixed(1)} dy${dy.toFixed(1)}`)
  }
  return `차이 ${diffs.length}건\n${diffs.join('\n')}\n화면에 없음(데이터 차이 등) ${missing.length}건: ${missing.join(' | ')}`
}

/** 차이가 tolerance(px)보다 큰 항목만 돌려준다. 글자 x는 왼쪽 정렬 기준, y는 글줄 가운데 기준. */
export function compareLayout(tolerance = 1) {
  const roots = [...document.querySelectorAll('[class*="_root_"]')]
  const report: string[] = []
  for (const [key, f] of Object.entries(figma as unknown as Record<string, Entry>)) {
    const want = f.t.map((x) => x[0])
    let best: { el: Element; tr: [string, DOMRect][] } | null = null
    for (const el of roots) {
      const tr = textRects(el)
      const have = tr.map((x) => x[0])
      if (want.every((w) => have.includes(w)) && (!best || tr.length < best.tr.length)) best = { el, tr }
    }
    if (!best) {
      report.push(`${key}: 화면에 없음`)
      continue
    }
    const o = best.el.getBoundingClientRect()
    const diffs: string[] = []
    if (Math.abs(o.width - f.w) > tolerance) diffs.push(`w ${o.width.toFixed(1)}≠${f.w}`)
    if (Math.abs(o.height - f.h) > tolerance) diffs.push(`h ${o.height.toFixed(1)}≠${f.h}`)
    for (const [t, fx, fy, , fh] of f.t) {
      const d = best.tr.find((x) => x[0] === t)
      if (!d) continue
      const b = d[1]
      const dx = b.x - o.x - fx
      const dy = b.y + b.height / 2 - o.y - (fy + fh / 2)
      if (Math.abs(dx) > tolerance || Math.abs(dy) > tolerance) diffs.push(`"${t}" dx${dx.toFixed(1)} dy${dy.toFixed(1)}`)
    }
    report.push(`${key}: ${diffs.length ? diffs.join('; ') : 'OK'}`)
  }
  return report.join('\n')
}
