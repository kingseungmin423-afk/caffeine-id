// 앱 아이콘·로고: design/logo/app-icon.svg(피그마 'AppIcon/A2 신분증 (확정)', 77:1728에서 SVG로 내보낸 원본)를
// 크기별 PNG로 만든다. 로고를 바꾸면 피그마에서 SVG를 다시 내보내 덮어쓰고 `npm run app-icons`.
// - public/icons/*: PWA(manifest·홈 화면·탭 아이콘). 그림이 가운데 안전 영역 안에 있어 maskable도 같은 그림
// - design/logo/toss-logo-600.png: 앱인토스 콘솔 '앱 로고'·'다크모드 앱 로고'(600×600)
import { mkdirSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const svg = readFileSync(resolve(root, 'design/logo/app-icon.svg'))
const icons = resolve(root, 'public/icons')
mkdirSync(icons, { recursive: true })

const jobs = [
  ['public/icons/icon-192.png', 192],
  ['public/icons/icon-512.png', 512],
  ['public/icons/icon-maskable-512.png', 512],
  ['public/icons/apple-touch-icon-180.png', 180],
  ['public/icons/favicon-48.png', 48],
  ['design/logo/toss-logo-600.png', 600],
]
for (const [file, size] of jobs) {
  // 원본은 512 기준이라 크게 그린 뒤 줄여서 가장자리를 매끄럽게
  await sharp(svg, { density: Math.ceil((72 * size * 2) / 512) }).resize(size, size).png().toFile(resolve(root, file))
  console.log(file)
}
