// 피그마 플러그인 API에서 실행하는 아이콘 추출 스크립트 (읽기 전용).
// 실행: Figma MCP `use_figma`로 실행 → 반환된 JSON을 app/design/figma-icons.json 으로 저장 → `npm run icons`
// 대상: icon/*, illust/* 컴포넌트, CategoryIcon 세트의 변형 전부. 이름은 피그마 컴포넌트 이름 그대로.

const page = figma.root.children.find((p) => p.name === '시안 찐 확정(1026)') || figma.root.children[0];
await figma.setCurrentPageAsync(page);

const targets = [];
for (const n of page.findAllWithCriteria({ types: ['COMPONENT'] })) {
  const set = n.parent && n.parent.type === 'COMPONENT_SET' ? n.parent : null;
  if (!set && /^(icon|illust)\//.test(n.name)) targets.push({ name: n.name, node: n });
  if (set && set.name === 'CategoryIcon') targets.push({ name: 'CategoryIcon/' + n.name.split('=')[1], node: n });
}

const out = {};
for (const t of targets) {
  out[t.name] = await t.node.exportAsync({ format: 'SVG_STRING', svgIdAttribute: false, svgOutlineText: true });
}
return out;
