// 임시 앱 아이콘: src/styles/tokens.resolved.json 색으로 public/icons/*.png 를 만든다.
// 사용자가 진짜 아이콘(192·512·maskable)을 주면 public/icons 파일만 바꾸고 이 스크립트는 지운다.
import { mkdirSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const tokens = JSON.parse(readFileSync(resolve(root, 'src/styles/tokens.resolved.json'), 'utf8'))
const bg = tokens['--bg-inverse']
const fg = tokens['--text-inverse']
const accent = tokens['--accent-gold']
const out = resolve(root, 'public/icons')
mkdirSync(out, { recursive: true })

// 512 기준 그림. safe = 가운데 안전 영역 비율 (maskable은 지름 80% 원 안에 내용이 있어야 한다)
const svg = (safe) => {
  const s = 512 * safe
  const o = (512 - s) / 2
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="${bg}"/>
  <g transform="translate(${o} ${o}) scale(${safe})">
    <rect x="136" y="96" width="240" height="320" rx="28" fill="none" stroke="${fg}" stroke-width="20"/>
    <rect x="216" y="128" width="80" height="16" rx="8" fill="${fg}"/>
    <text x="256" y="318" text-anchor="middle" font-family="Arial, sans-serif" font-weight="900" font-size="132" fill="${fg}">ID</text>
    <rect x="186" y="350" width="140" height="14" rx="7" fill="${accent}"/>
  </g>
</svg>`
}

const jobs = [
  ['icon-192.png', 192, 1],
  ['icon-512.png', 512, 1],
  ['icon-maskable-512.png', 512, 0.72],
  ['apple-touch-icon-180.png', 180, 0.86],
  ['favicon-48.png', 48, 1],
]
for (const [name, size, safe] of jobs) {
  await sharp(Buffer.from(svg(safe))).resize(size, size).png().toFile(resolve(out, name))
  console.log('icons/' + name)
}
