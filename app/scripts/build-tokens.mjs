// design/figma-tokens.json → src/styles/tokens.css, src/styles/tokens.resolved.json
// 이 파일이 만드는 결과물은 손으로 고치지 않는다. 피그마가 바뀌면 export → `npm run tokens`.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const src = JSON.parse(readFileSync(resolve(root, 'design/figma-tokens.json'), 'utf8'));
const outCss = resolve(root, 'src/styles/tokens.css');
const outJson = resolve(root, 'src/styles/tokens.resolved.json');

// 피그마 이름 → CSS 이름
// 한글은 그대로 둔다(피그마 변형 값이 한글인 효과 이름: --shadow-idcard-확인)
const slug = (s) => s.toLowerCase().replace(/[·%]/g, ' ').replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '');
const cssVar = (figmaName) => '--' + slug(figmaName);

const FONT_WEIGHT = { Thin: 100, ExtraLight: 200, Light: 300, Regular: 400, Medium: 500, SemiBold: 600, Bold: 700, ExtraBold: 800, Black: 900 };
const FONT_FALLBACK = "-apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif";
const round = (n, d = 2) => +n.toFixed(d);

// --- 변수 ---------------------------------------------------------------
const all = {};
for (const vars of Object.values(src.collections)) Object.assign(all, vars);

const resolved = {};
const resolveValue = (name, seen = new Set()) => {
  if (seen.has(name)) throw new Error('순환 참조: ' + name);
  seen.add(name);
  const v = all[name];
  if (!v) throw new Error('없는 변수: ' + name);
  return v.alias ? resolveValue(v.alias, seen) : v.value;
};

const declare = (name, v) => {
  if (v.alias) return `${cssVar(name)}: var(${cssVar(v.alias)});`;
  if (v.type === 'COLOR') return `${cssVar(name)}: ${v.value};`;
  if (name === 'font/family') return `${cssVar(name)}: '${v.value}', ${FONT_FALLBACK};`;
  if (name.startsWith('font/weight/')) {
    const w = FONT_WEIGHT[v.value];
    if (!w) throw new Error('알 수 없는 굵기: ' + v.value);
    return `${cssVar(name)}: ${w};`;
  }
  if (v.type === 'FLOAT') return `${cssVar(name)}: ${v.value}px;`;
  return `${cssVar(name)}: ${JSON.stringify(v.value)};`;
};

const blocks = [];
for (const [collection, vars] of Object.entries(src.collections)) {
  const lines = Object.entries(vars).map(([name, v]) => {
    resolved[cssVar(name)] = resolveValue(name);
    return '  ' + declare(name, v);
  });
  blocks.push(`  /* ${collection} */\n${lines.join('\n')}`);
}

// --- 그림자·블러 ----------------------------------------------------------
// 한 세트의 모든 변형이 같은 효과를 쓰면 변형 값을 빼고 세트 이름만 쓴다. (RelatedCard 조회·미조회 → RelatedCard)
const effectName = (e) => {
  const sets = new Set(e.users.map((u) => u.split(' ')[0]));
  return e.users.length > 1 && sets.size === 1 ? [...sets][0] : e.name;
};
const effectLines = [];
const usedNames = new Set();
for (const e of src.effects) {
  const base = slug(effectName(e));
  if (usedNames.has(base)) throw new Error(`효과 이름 중복: ${base} — export-tokens.figma.js의 이름 규칙을 확인`);
  usedNames.add(base);
  const shadows = e.effects.filter((x) => x.type.endsWith('SHADOW'))
    .map((x) => `${x.type === 'INNER_SHADOW' ? 'inset ' : ''}${x.x}px ${x.y}px ${x.radius}px ${x.spread}px ${x.color}`);
  const blur = e.effects.find((x) => x.type === 'BACKGROUND_BLUR');
  if (shadows.length) effectLines.push(`  --shadow-${base}: ${shadows.join(', ')};`);
  // 피그마 배경 블러 값은 CSS blur()의 2배 (Dev Mode 출력과 동일하게 환산)
  if (blur) effectLines.push(`  --blur-${base}: blur(${blur.radius / 2}px);`);
}
blocks.push(`  /* Effects (피그마 노드에서 수집) */\n${effectLines.join('\n')}`);

// --- 그라디언트 ------------------------------------------------------------
const gradientCss = (g) => {
  if (g.type !== 'GRADIENT_LINEAR') throw new Error('지원하지 않는 그라디언트: ' + g.type);
  // gradientTransform(노드→그라디언트 공간)의 역변환으로 시작·끝 점을 구한다.
  const [[a, b, c], [d, e, f]] = g.transform;
  const det = a * e - b * d;
  const inv = (u, v) => [(e * (u - c) - b * (v - f)) / det, (-d * (u - c) + a * (v - f)) / det];
  const [x0, y0] = inv(0, 0.5);
  const [x1, y1] = inv(1, 0.5);
  const angle = round(((Math.atan2(x1 - x0, -(y1 - y0)) * 180) / Math.PI + 360) % 360);
  const stops = g.stops.map((s) => `${s.variable ? `var(${cssVar(s.variable)})` : s.color} ${round(s.position * 100)}%`);
  return `linear-gradient(${angle}deg, ${stops.join(', ')})`;
};
blocks.push(`  /* Gradients */\n${src.gradients.map((g) => `  --gradient-${slug(g.name)}: ${gradientCss(g)};`).join('\n')}`);

// --- 컴포넌트·화면 치수 (design/figma-metrics.txt, figma-screen-metrics.txt) ------------------------------
// 피그마 변수가 없는 값: 고정 크기·선 굵기·점선·회전·절대 위치. 이름은 --m-<컴포넌트>[-<변형값>]-<노드 경로>-<속성>
const metricsFiles = ['design/figma-metrics.txt', 'design/figma-screen-metrics.txt'].map((f) => resolve(root, f));
const metricLines = [];
const UNIT = { w: 'px', h: 'px', x: 'px', y: 'px', stroke: 'px', radius: 'px', gap: 'px', cgap: 'px', pt: 'px', pr: 'px', pb: 'px', pl: 'px', rotate: 'deg', fs: 'px', dash: '', opacity: '' };
const metricNames = new Set();
for (const raw of metricsFiles.flatMap((f) => readFileSync(f, 'utf8').split(/\r?\n/))) {
  if (!raw.trim()) continue;
  const [comp, variant, path, rest] = raw.split('|');
  const [prop, value] = rest.split('=');
  if (!(prop in UNIT)) throw new Error('알 수 없는 치수 속성: ' + raw);
  const variantSlug = variant ? slug(variant.split(',').map((p) => p.split('=')[1]).join(' ')) : '';
  const name = '--m-' + [slug(comp), variantSlug, slug(path.replace(/\//g, ' ')), prop].filter(Boolean).join('-');
  if (metricNames.has(name)) throw new Error('치수 이름 중복: ' + name);
  metricNames.add(name);
  const css = UNIT[prop] ? value.split(' ').map((v) => v + UNIT[prop]).join(' ') : value;
  metricLines.push(`  ${name}: ${css};`);
}
blocks.push(`  /* Component metrics (Components v2에서 수집, 변수가 없는 값) */\n${metricLines.join('\n')}`);

// --- 텍스트 스타일 ----------------------------------------------------------
// 피그마는 % 줄 높이를 정수 px로 반올림해 그린다 (13px × 150% = 19.5 → 20). 브라우저도 같게 맞춘다.
const lineHeight = (lh, size) => (lh.unit === 'AUTO' ? 'normal' : lh.unit === 'PERCENT' ? `${Math.round((size * lh.value) / 100)}px` : `${lh.value}px`);
const letterSpacing = (ls) => (ls.unit === 'PERCENT' ? `${round(ls.value / 100, 4)}em` : `${ls.value}px`);
const textClasses = src.textStyles.map((s) => {
  const size = s.vars.fontSize ? `var(${cssVar(s.vars.fontSize)})` : `${s.size}px`;
  const weightVar = s.vars.fontStyle || Object.keys(all).find((k) => k.startsWith('font/weight/') && all[k].value === s.style);
  const weight = weightVar ? `var(${cssVar(weightVar)})` : FONT_WEIGHT[s.style];
  const family = s.vars.fontFamily ? `var(${cssVar(s.vars.fontFamily)})` : `'${s.family}'`;
  return `/* ${s.name} */
.t-${slug(s.name)} {
  font-family: ${family};
  font-size: ${size};
  font-weight: ${weight};
  line-height: ${lineHeight(s.lineHeight, s.size)};
  letter-spacing: ${letterSpacing(s.letterSpacing)};
}`;
});

const header = `/* 자동 생성 파일 — 직접 수정 금지.
 * 원본: 피그마 ${src.fileKey} / ${src.page} (내보낸 시각 ${src.exportedAt})
 * 다시 만들기: scripts/figma/export-tokens.figma.js 실행 → design/figma-tokens.json 저장 → npm run tokens
 */`;

const css = `${header}\n\n:root {\n${blocks.join('\n\n')}\n}\n\n/* Text styles (${src.textStyles.length}) */\n${textClasses.join('\n\n')}\n`;

mkdirSync(dirname(outCss), { recursive: true });
writeFileSync(outCss, css);
writeFileSync(outJson, JSON.stringify(resolved, null, 2) + '\n');
console.log(`tokens.css: 변수 ${Object.keys(resolved).length}개, 치수 ${metricLines.length}개, 효과 ${effectLines.length}개, 그라디언트 ${src.gradients.length}개, 텍스트 스타일 ${src.textStyles.length}개`);
