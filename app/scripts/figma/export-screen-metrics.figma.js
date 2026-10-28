// 피그마 플러그인 API에서 실행하는 화면 치수 추출 스크립트 (읽기 전용).
// 화면 프레임 안 요소의 위치·크기(변수가 없는 값)를 모은다. 화면 레이아웃 CSS가 이 값으로 간격을 계산한다.
// 실행: Figma MCP `use_figma`로 실행 → 반환 텍스트를 app/design/figma-screen-metrics.txt 로 저장 → `npm run tokens`
// 결과 이름: --m-screen-<화면 키>-<노드 경로>-<속성>  (예: --m-screen-main-headline-y)

const SCREENS = {
  '1:636': 'welcome',
  '1:678': 'main',
  '1:760': 'category',
  '1:806': 'category-detail',
  '1:823': 'search',
  '1:643': 'loading',
  '1:842': 'result',
  '1:865': 'result-back',
  '1:1554': 'estimate',
  '1:1581': 'report',
  '1:1610': 'info',
  '1:999': 'flip-mid', // flip 05→06 · 2: 카드 뒤집기 중간 (가로로 접혀 떠오른 순간)
};

// 컴포넌트로 그리는 부분은 안을 보지 않는다 (치수는 컴포넌트 쪽 --m-*에 있다)
const SKIP_INSIDE = /^(rank\/|category\/|option\/|FoodRow|RelatedCard|IDCardMini|Chip|step|article|similar-row|CategoryItem|ProductThumb|add-photo|icon\/|search-field|input|TabBar|section-header|flip\/)/;

const r = (v) => Math.round(v * 100) / 100;
const isAL = (n) => n && 'layoutMode' in n && n.layoutMode !== 'NONE';
const bound = (n, k) => !!(n.boundVariables && n.boundVariables[k]);
const childPath = (c) => {
  const same = c.parent.children.filter((s) => s.name === c.name);
  return c.name + (same.length > 1 ? '-' + (same.indexOf(c) + 1) : '');
};

const collect = (n, isRoot) => {
  const m = {};
  const p = n.parent;
  const free = isRoot || !isAL(p) || n.layoutPositioning === 'ABSOLUTE';
  if (free && !isRoot) { m.x = r(n.x); m.y = r(n.y); }
  // 화면 바로 아래 요소와 자유 배치 요소는 크기를 모두, 오토 레이아웃 안은 고정 크기만
  if (free || n.layoutSizingHorizontal === 'FIXED') m.w = r(n.width);
  if (free || n.layoutSizingVertical === 'FIXED') m.h = r(n.height);
  if (n.rotation) m.rotate = r(-n.rotation);
  if (isAL(n) && n.type !== 'INSTANCE') {
    if (n.itemSpacing && !bound(n, 'itemSpacing') && n.primaryAxisAlignItems !== 'SPACE_BETWEEN') m.gap = r(n.itemSpacing);
    if (n.layoutWrap === 'WRAP' && n.counterAxisSpacing && !bound(n, 'counterAxisSpacing')) m.cgap = r(n.counterAxisSpacing);
  }
  if (n.type !== 'TEXT' && n.type !== 'INSTANCE' && Array.isArray(n.strokes) && n.strokes.some((s) => s.visible !== false)) {
    m.stroke = n.strokeWeight === figma.mixed
      ? [n.strokeTopWeight, n.strokeRightWeight, n.strokeBottomWeight, n.strokeLeftWeight].map(r).join(' ')
      : r(n.strokeWeight);
  }
  if (n.type === 'TEXT' && !n.textStyleId) m.fs = r(n.fontSize);
  return m;
};

const lines = [];
const page = figma.root.children.find((p) => p.name === '시안 찐 확정(1026)') || figma.root.children[0];
await figma.setCurrentPageAsync(page);
for (const [id, key] of Object.entries(SCREENS)) {
  const f = await figma.getNodeByIdAsync(id);
  const push = (path, m) => { for (const [k, v] of Object.entries(m)) lines.push(`Screen-${key}||${path}|${k}=${v}`); };
  push('', { w: r(f.width), h: r(f.height) });
  const walk = (n, path) => {
    if (n.visible === false) return;
    push(path, collect(n, false));
    if (n.type === 'INSTANCE' || !('children' in n) || SKIP_INSIDE.test(n.name)) return;
    for (const c of n.children) walk(c, path + '/' + childPath(c));
  };
  for (const c of f.children) walk(c, childPath(c));
}
return lines.join('\n');
