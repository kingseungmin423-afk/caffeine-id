// design/figma-svg/*.svg (Figma MCP download_assets 원본) → src/assets/{icons,illust,category}/*.svg
// 원본에는 피그마 캔버스 배경·컴포넌트 세트 테두리가 함께 들어 있어서, 컴포넌트 그룹만 잘라 낸다.
// 한 가지 색만 쓰는 아이콘(icon/*, CategoryIcon/*)은 그 색을 currentColor로 바꿔 CSS 토큰으로 칠할 수 있게 한다.
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(readFileSync(resolve(root, 'design/figma-icons.json'), 'utf8'));

const OUT_DIR = { icon: 'icons', illust: 'illust', CategoryIcon: 'category' };
const MONO = new Set(['icon', 'CategoryIcon']);

const decode = (s) => s.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
  .replace(/[\x80-\xff]+/g, (m) => Buffer.from(m, 'latin1').toString('utf8'));

// id가 target인 <g ...> 요소를 짝이 맞는 </g>까지 잘라 낸다.
const extractGroup = (svg, target) => {
  const open = /<g\b[^>]*\bid="([^"]*)"[^>]*>/g;
  let m;
  while ((m = open.exec(svg))) {
    if (decode(m[1]) !== target) continue;
    const tag = /<\/?g\b[^>]*?(\/)?>/g;
    tag.lastIndex = m.index + m[0].length;
    let depth = 1, t;
    while ((t = tag.exec(svg))) {
      if (t[0].startsWith('</')) depth--;
      else if (!t[1]) depth++;
      if (depth === 0) return svg.slice(m.index, t.index + t[0].length);
    }
  }
  return null;
};

const done = [];
for (const [name] of Object.entries(manifest.icons)) {
  const [kind, ...rest] = name.split('/');
  const file = resolve(root, 'design/figma-svg', name.replace(/\//g, '__') + '.svg');
  if (!existsSync(file)) throw new Error('원본 없음: ' + file);
  const raw = readFileSync(file, 'utf8');

  const head = raw.match(/<svg\b[^>]*>/)[0];
  // 세트 안의 변형은 그룹 id가 '속성=값' 형태
  const groupId = kind === 'CategoryIcon' ? `분류=${rest.join('/')}` : name;
  const group = extractGroup(raw, groupId);
  if (!group) throw new Error(`${name}: 그룹 "${groupId}"를 찾지 못함`);
  const defs = (raw.match(/<defs>[\s\S]*<\/defs>/) || [''])[0];

  // url(#…)로 참조되는 id만 남기고 나머지 id 속성은 지운다.
  const used = new Set([...(group.matchAll(/url\(#([^)]+)\)/g))].map((x) => x[1]));
  let body = (group + '\n' + defs).replace(/\sid="([^"]*)"/g, (all, id) => (used.has(id) ? all : ''));

  if (MONO.has(kind)) {
    const colors = new Set([...body.matchAll(/(?:fill|stroke)="(#[0-9A-Fa-f]{6})"/g)].map((x) => x[1].toUpperCase()));
    colors.delete('#FFFFFF');
    if (colors.size === 1) {
      const [c] = colors;
      body = body.replace(new RegExp(`(fill|stroke)="${c}"`, 'gi'), '$1="currentColor"');
    }
  }

  const name0 = rest.join('-');
  const dir = resolve(root, 'src/assets', OUT_DIR[kind]);
  mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(dir, name0 + '.svg'), `<!-- 피그마 ${name} (${manifest.icons[name]}) 자동 생성 -->\n${head}\n${body}\n</svg>\n`);
  done.push(`${OUT_DIR[kind]}/${name0}.svg`);
}

// 예전에 만든 파일 중 매니페스트에 없는 것은 남기지 않는다.
for (const d of Object.values(OUT_DIR)) {
  const dir = resolve(root, 'src/assets', d);
  if (!existsSync(dir)) continue;
  for (const f of (await import('node:fs')).readdirSync(dir)) {
    if (!done.includes(`${d}/${f}`)) rmSync(resolve(dir, f));
  }
}
console.log(`아이콘 ${done.length}개 생성:\n  ` + done.join('\n  '));
