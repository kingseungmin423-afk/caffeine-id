// 피그마 플러그인 API에서 실행하는 컴포넌트 치수 추출 스크립트 (읽기 전용).
// 토큰(변수)이 없는 값 — 고정 크기, 선 굵기, 점선, 회전, 절대 위치, 변수 없는 모서리·간격 — 을
// Components v2의 모든 컴포넌트에서 모은다.
// 실행: Figma MCP `use_figma`로 실행 → 반환 텍스트를 app/design/figma-metrics.txt 로 저장 → `npm run tokens`
// 결과 이름: --m-<컴포넌트>[-<변형값>]-<노드 경로>-<속성>. 변형끼리 값이 같으면 변형값을 뺀다.

const page = figma.root.children.find((p) => p.name === '시안 찐 확정(1026)') || figma.root.children[0];
await figma.setCurrentPageAsync(page);
const sec = page.children.find((n) => n.name === 'Components v2');
const SKIP = new Set(['HomeIndicator']); // 앱에서 구현하지 않는 노드
const SKIP_SETS = new Set(['HomeIndicator', 'CategoryIcon']); // 치수를 뽑지 않는 세트(아이콘 자체)
const r = (v) => Math.round(v * 100) / 100;
const isAL = (n) => n && 'layoutMode' in n && n.layoutMode !== 'NONE';
const bound = (n, k) => !!(n.boundVariables && n.boundVariables[k]);

const collect = (n, isRoot) => {
  const m = {};
  const p = n.parent;
  if (n.type !== 'TEXT') {
    let fixW, fixH;
    if (isRoot) {
      if (isAL(n)) {
        const h = n.layoutMode === 'HORIZONTAL';
        fixW = (h ? n.primaryAxisSizingMode : n.counterAxisSizingMode) === 'FIXED';
        fixH = (h ? n.counterAxisSizingMode : n.primaryAxisSizingMode) === 'FIXED';
      } else fixW = fixH = true;
    } else if (isAL(p) && n.layoutPositioning !== 'ABSOLUTE') {
      fixW = n.layoutSizingHorizontal === 'FIXED';
      fixH = n.layoutSizingVertical === 'FIXED';
    } else {
      fixW = fixH = true;
    }
    if (fixW) m.w = r(n.width);
    if (fixH) m.h = r(n.height);
    const strokes = Array.isArray(n.strokes) ? n.strokes.filter((s) => s.visible !== false) : [];
    if (strokes.length) {
      m.stroke = n.strokeWeight === figma.mixed
        ? [n.strokeTopWeight, n.strokeRightWeight, n.strokeBottomWeight, n.strokeLeftWeight].map(r).join(' ')
        : r(n.strokeWeight);
      if (n.dashPattern && n.dashPattern.length) m.dash = n.dashPattern.map(r).join(' ');
    }
    if ('cornerRadius' in n && n.cornerRadius !== figma.mixed && n.cornerRadius > 0 && !bound(n, 'topLeftRadius')) m.radius = r(n.cornerRadius);
    if (isAL(n)) {
      if (n.itemSpacing && !bound(n, 'itemSpacing') && n.primaryAxisAlignItems !== 'SPACE_BETWEEN') m.gap = r(n.itemSpacing);
      for (const [k, s] of [['paddingTop', 'pt'], ['paddingRight', 'pr'], ['paddingBottom', 'pb'], ['paddingLeft', 'pl']]) if (n[k] && !bound(n, k)) m[s] = r(n[k]);
    }
  }
  if (n.type === 'TEXT') {
    // 텍스트 스타일이 없는 글자 크기, 고정 폭 텍스트
    if (!n.textStyleId) m.fs = r(n.fontSize);
    if (n.textAutoResize === 'NONE' && (!isAL(p) || n.layoutSizingHorizontal === 'FIXED')) { m.w = r(n.width); m.h = r(n.height); }
  }
  if (n.rotation) m.rotate = r(-n.rotation); // 피그마는 반시계, CSS는 시계 방향
  if (!isRoot && (!isAL(p) || n.layoutPositioning === 'ABSOLUTE')) { m.x = r(n.x); m.y = r(n.y); }
  if (n.opacity < 1) m.opacity = r(n.opacity);
  return m;
};

// 형제 중 이름이 겹치면 -2, -3을 붙인다.
const childPath = (c) => {
  const same = c.parent.children.filter((s) => s.name === c.name);
  return c.name + (same.length > 1 ? '-' + (same.indexOf(c) + 1) : '');
};
const walk = (n, path, out, isRoot) => {
  if (n.visible === false && !isRoot) return;
  const m = collect(n, isRoot);
  if (Object.keys(m).length) out[path] = m;
  if (n.type === 'INSTANCE' || !('children' in n)) return;
  for (const c of n.children) if (!SKIP.has(c.name)) walk(c, path ? path + '/' + childPath(c) : childPath(c), out, false);
};

const lines = [];
for (const s of sec.children) {
  if (s.type !== 'COMPONENT_SET' && s.type !== 'COMPONENT') continue;
  if (SKIP_SETS.has(s.name) || /^(icon|illust)\//.test(s.name) || s.name.includes('(이전)')) continue;
  const variants = s.type === 'COMPONENT_SET' ? s.children : [s];
  const per = variants.map((v) => { const o = {}; walk(v, '', o, true); return { v: v.name, o }; });
  const keys = new Set();
  for (const { o } of per) for (const [path, m] of Object.entries(o)) for (const k of Object.keys(m)) keys.add(path + '|' + k);
  for (const key of keys) {
    const [path, prop] = key.split('|');
    const vals = per.map(({ v, o }) => ({ v, val: o[path] && o[path][prop] }));
    const present = vals.filter((x) => x.val !== undefined);
    // 값이 있는 변형끼리 같으면 하나로 (예: 도장은 확인·추정에만 있지만 크기는 같음)
    const allSame = new Set(present.map((x) => String(x.val))).size === 1;
    if (allSame) lines.push(`${s.name}||${path}|${prop}=${present[0].val}`);
    else for (const x of present) lines.push(`${s.name}|${x.v}|${path}|${prop}=${x.val}`);
  }
}
return lines.join('\n');
