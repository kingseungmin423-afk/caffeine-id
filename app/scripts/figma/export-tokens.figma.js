// 피그마 플러그인 API에서 실행하는 토큰 추출 스크립트 (읽기 전용).
// 실행: Figma MCP `use_figma`에 이 파일 내용을 그대로 넣고 실행 →
//       반환된 JSON을 app/design/figma-tokens.json 으로 저장 → `npm run tokens`
// 파일: 2UocI4QnNWt4WWg6w0cVn4 (포트폴리오 디자인 PWA 확정본)

const hex = (c) => {
  const h = (x) => Math.round(x * 255).toString(16).padStart(2, '0');
  return '#' + h(c.r) + h(c.g) + h(c.b) + (c.a !== undefined && c.a < 1 ? h(c.a) : '');
};
const varName = async (id) => (await figma.variables.getVariableByIdAsync(id)).name;

// 1) 변수 컬렉션 (모드는 컬렉션마다 1개)
const collections = {};
for (const c of await figma.variables.getLocalVariableCollectionsAsync()) {
  const mode = c.modes[0].modeId;
  const vars = {};
  for (const id of c.variableIds) {
    const v = await figma.variables.getVariableByIdAsync(id);
    const val = v.valuesByMode[mode];
    if (val && val.type === 'VARIABLE_ALIAS') vars[v.name] = { type: v.resolvedType, alias: await varName(val.id) };
    else if (v.resolvedType === 'COLOR') vars[v.name] = { type: 'COLOR', value: hex(val) };
    else vars[v.name] = { type: v.resolvedType, value: val };
  }
  collections[c.name] = vars;
}

// 2) 텍스트 스타일
const textStyles = [];
for (const s of await figma.getLocalTextStylesAsync()) {
  const bound = {};
  for (const [k, b] of Object.entries(s.boundVariables || {})) bound[k] = await varName(b.id);
  textStyles.push({
    name: s.name,
    family: s.fontName.family,
    style: s.fontName.style,
    size: s.fontSize,
    lineHeight: s.lineHeight.unit === 'AUTO' ? { unit: 'AUTO' } : { unit: s.lineHeight.unit, value: s.lineHeight.value },
    letterSpacing: { unit: s.letterSpacing.unit, value: s.letterSpacing.value },
    vars: bound,
  });
}

// 3) 그림자·블러, 그라디언트 (피그마에 스타일로 등록돼 있지 않아 노드에서 수집)
const page = figma.root.children.find((p) => p.name === '시안 찐 확정(1026)') || figma.root.children[0];
await figma.setCurrentPageAsync(page);

// 효과·그라디언트는 'Components v2' 섹션(화면에서 뽑은 최신 컴포넌트)에서만 모은다. 없으면 페이지 전체.
const scope = page.children.find((n) => n.name === 'Components v2') || page;

// 이름: 세트 이름 + Theme 값(있으면) 또는 첫 변형 값. 예) 'TabBar Light', 'IDCard 확인'
const owner = (n) => {
  let p = n;
  while (p && p.type !== 'COMPONENT' && p.type !== 'PAGE') p = p.parent;
  if (p && p.type === 'COMPONENT') {
    const set = p.parent && p.parent.type === 'COMPONENT_SET' ? p.parent : null;
    const theme = set && (p.name.match(/Theme=([^,]+)/) || [])[1];
    const first = set && (p.name.match(/^[^=]+=([^,]+)/) || [])[1];
    return { name: (set ? set.name : p.name) + (set ? ' ' + (theme || first) : ''), inComponent: true };
  }
  return { name: n.name.split('/')[0], inComponent: false };
};

const effectGroups = new Map();
for (const n of scope.findAll((n) => 'effects' in n && n.effects.length > 0)) {
  const list = n.effects.filter((e) => e.visible !== false).map((e) =>
    e.type.endsWith('SHADOW')
      ? { type: e.type, color: hex(e.color), x: e.offset.x, y: e.offset.y, radius: e.radius, spread: e.spread || 0 }
      : { type: e.type, radius: e.radius });
  if (!list.length) continue;
  const key = JSON.stringify(list);
  const g = effectGroups.get(key) || { effects: list, users: [] };
  g.users.push(owner(n));
  effectGroups.set(key, g);
}
const effects = [...effectGroups.values()].map((g) => {
  const pick = g.users.find((u) => u.inComponent) || g.users[0];
  return { name: pick.name, effects: g.effects, users: [...new Set(g.users.map((u) => u.name))] };
});

const gradients = [];
for (const n of page.findAll((n) => n.type !== 'COMPONENT_SET' && n.type !== 'SECTION' && 'fills' in n && Array.isArray(n.fills))) {
  for (const f of n.fills) {
    if (!f.type.startsWith('GRADIENT') || f.visible === false) continue;
    const stops = [];
    for (const s of f.gradientStops) {
      stops.push({
        position: s.position,
        color: hex(s.color),
        variable: s.boundVariables && s.boundVariables.color ? await varName(s.boundVariables.color.id) : null,
      });
    }
    gradients.push({ name: owner(n).name, type: f.type, transform: f.gradientTransform, opacity: f.opacity, stops });
  }
}

return { fileKey: figma.fileKey, page: page.name, exportedAt: new Date().toISOString(), collections, textStyles, effects, gradients };
