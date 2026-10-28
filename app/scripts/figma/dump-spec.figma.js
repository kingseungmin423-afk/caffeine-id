// 피그마 플러그인 API에서 실행하는 컴포넌트 스펙 덤프 (읽기 전용).
// Components v2의 세트 이름을 NAMES에 넣고 Figma MCP `use_figma`로 실행 → 노드마다 한 줄(레이아웃·토큰·텍스트 스타일).
const NAMES = ['Badge'];

const page = figma.root.children.find((p) => p.name === '시안 찐 확정(1026)') || figma.root.children[0];
await figma.setCurrentPageAsync(page);
const sec = page.children.find((n) => n.name === 'Components v2');
const vn = async (b) => (b ? (await figma.variables.getVariableByIdAsync(b.id)).name : null);
const hex = (c, o) => '#' + [c.r, c.g, c.b].map((x) => Math.round(x * 255).toString(16).padStart(2, '0')).join('') + (o !== undefined && o < 1 ? '@' + Math.round(o * 100) : '');
const paints = async (arr) => {
  if (!Array.isArray(arr)) return '';
  const out = [];
  for (const p of arr) {
    if (p.visible === false) continue;
    if (p.type === 'SOLID') out.push((await vn(p.boundVariables && p.boundVariables.color)) || hex(p.color, p.opacity));
    else if (p.type === 'IMAGE') out.push('IMAGE');
    else out.push(p.type);
  }
  return out.join('+');
};
const num = async (n, key) => {
  const b = n.boundVariables && n.boundVariables[key];
  const v = n[key];
  return b ? (await vn(b)) : (typeof v === 'number' ? Math.round(v * 10) / 10 : v);
};
const line = async (n, d) => {
  const a = ['  '.repeat(d) + n.name, n.type === 'INSTANCE' ? 'INST→' + ((await n.getMainComponentAsync()) || {}).name : n.type, Math.round(n.width) + 'x' + Math.round(n.height)];
  if (n.visible === false) a.push('HIDDEN');
  if (n.layoutPositioning === 'ABSOLUTE') a.push(`abs@${Math.round(n.x)},${Math.round(n.y)}`);
  if (n.rotation) a.push('rot' + Math.round(n.rotation));
  if (n.opacity !== undefined && n.opacity < 1) a.push('opacity' + Math.round(n.opacity * 100));
  if ('layoutMode' in n && n.layoutMode !== 'NONE') {
    a.push(`AL:${n.layoutMode[0]} gap:${await num(n, 'itemSpacing')} pad:${await num(n, 'paddingTop')},${await num(n, 'paddingRight')},${await num(n, 'paddingBottom')},${await num(n, 'paddingLeft')} main:${n.primaryAxisAlignItems} cross:${n.counterAxisAlignItems}${n.layoutWrap === 'WRAP' ? ' WRAP' : ''}`);
  }
  if (n.parent && 'layoutMode' in n.parent && n.parent.layoutMode !== 'NONE') a.push(`size:${n.layoutSizingHorizontal[0]}/${n.layoutSizingVertical[0]}${n.layoutGrow ? ' grow' : ''}`);
  if (n.type !== 'TEXT') { const f = await paints(n.fills); if (f) a.push('fill:' + f); }
  const s = await paints(n.strokes);
  if (s) a.push(`stroke:${s} ${n.strokeWeight === figma.mixed ? 'mixed' : n.strokeWeight}${n.dashPattern && n.dashPattern.length ? ' dash' + n.dashPattern.join('/') : ''} ${n.strokeAlign}`);
  if ('cornerRadius' in n && n.cornerRadius !== 0) a.push('radius:' + (n.cornerRadius === figma.mixed ? [n.topLeftRadius, n.topRightRadius, n.bottomRightRadius, n.bottomLeftRadius].join('/') : await num(n, 'topLeftRadius')));
  if (n.effects && n.effects.length) a.push('fx:' + n.effects.map((e) => e.type[0] + (e.radius || '')).join(','));
  if (n.clipsContent) a.push('clip');
  if (n.type === 'TEXT') {
    const st = n.textStyleId && n.textStyleId !== figma.mixed ? (await figma.getStyleByIdAsync(n.textStyleId)).name : 'NOSTYLE';
    a.push(`"${n.characters.replace(/\n/g, '\\n')}" ${st} color:${await paints(n.fills)} align:${n.textAlignHorizontal}${n.textAutoResize !== 'WIDTH_AND_HEIGHT' ? ' resize:' + n.textAutoResize : ''}`);
  }
  return a.join(' | ');
};
const walk = async (n, d, out) => {
  out.push(await line(n, d));
  if ('children' in n && n.type !== 'INSTANCE') for (const c of n.children) await walk(c, d + 1, out);
};
const out = [];
for (const name of NAMES) {
  const s = sec.children.find((c) => c.name === name);
  out.push('### ' + name + ' ' + s.id);
  for (const v of s.type === 'COMPONENT_SET' ? s.children : [s]) await walk(v, 0, out);
}
return out.join('\n');
