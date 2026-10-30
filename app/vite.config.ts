import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'
import { VitePWA } from 'vite-plugin-pwa'
import tokenValues from './src/styles/tokens.resolved.json'
import dbData from './src/data/db.json'
import { CATEGORIES } from './src/data/categories'
import { SITE_URL } from './src/config/site'

// 앱 정보(manifest)의 색은 피그마 토큰에서 (npm run tokens가 만든 값)
const tokens = tokenValues as Record<string, string | number>
const token = (name: string) => String(tokens[name])

// 검색엔진 등록·링크 공유용 (PWA만)
// - index.html: 대표 주소(canonical), 공유 미리보기(Open Graph), 네이버 소유 확인
//   (구글은 가비아 DNS의 TXT 레코드로 소유 확인을 했다)
// - 빌드 결과에 robots.txt, sitemap.xml(홈·분류·정보 + 음식 1,603개), og-image.png(1200×630) 추가
const NAVER_SITE_VERIFICATION = '168ecfbbc17dee6b1e981311170539000aeb4599'
function seo(): Plugin {
  const page = (path: string) => SITE_URL + encodeURI(path)
  return {
    name: 'seo',
    transformIndexHtml: (html) =>
      html.replace(
        '</head>',
        [
          `<link rel="canonical" href="${SITE_URL}/" />`,
          `<meta name="naver-site-verification" content="${NAVER_SITE_VERIFICATION}" />`,
          `<meta property="og:type" content="website" />`,
          `<meta property="og:site_name" content="카페인 신분증" />`,
          `<meta property="og:locale" content="ko_KR" />`,
          `<meta property="og:url" content="${SITE_URL}/" />`,
          `<meta property="og:title" content="카페인 신분증 — 먹기 전에 음식 속 카페인 확인" />`,
          `<meta property="og:description" content="음식 이름을 검색하면 카페인 함량, 커피 몇 잔과 같은지, 하루 권고량 대비 비율을 신분증 카드로 보여줘요." />`,
          `<meta property="og:image" content="${SITE_URL}/og-image.png" />`,
          `<meta property="og:image:width" content="1200" />`,
          `<meta property="og:image:height" content="630" />`,
          `<meta name="twitter:card" content="summary_large_image" />`,
        ].join('\n    ') + '\n  </head>',
      ),
    async generateBundle() {
      const today = new Date().toISOString().slice(0, 10)
      const urls = [
        page('/'),
        page('/category'),
        ...CATEGORIES.map((c) => page(`/category/${c}`)),
        page('/info'),
        ...(dbData as { items: { id: string }[] }).items.map((i) => page(`/item/${i.id}`)),
      ]
      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
        .map((u) => `  <url><loc>${u}</loc><lastmod>${today}</lastmod></url>`)
        .join('\n')}\n</urlset>\n`
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: sitemap })
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n` })
      // 공유 미리보기 이미지: 콘솔용 가로 스크린샷을 1200×630으로
      const sharp = (await import('sharp')).default
      const og = await sharp('design/store-screenshots/6-landscape.png').resize(1200, 630, { fit: 'cover' }).png().toBuffer()
      this.emitFile({ type: 'asset', fileName: 'og-image.png', source: og })
    },
  }
}

// https://vite.dev/config/
// mode 'toss'(npm run build:toss)는 토스 미니앱용: PWA(서비스 워커·manifest)를 빼고 dist-toss에 상대 경로로 만든다.
// 그 밖의 mode는 지금의 PWA(Vercel) 빌드 그대로다.
export default defineConfig(({ mode }) => {
  const toss = mode === 'toss'
  return {
  base: toss ? './' : '/',
  build: toss ? { outDir: 'dist-toss' } : undefined,
  plugins: [
    // 아이콘 SVG를 `?react`로 불러오면 React 컴포넌트가 된다 (currentColor로 토큰 색 적용)
    react(),
    svgr(),
    // index.html의 %TOKEN:--이름% 자리에 토큰 값을 넣는다 (theme-color 등)
    {
      name: 'html-tokens',
      transformIndexHtml: (html) => html.replace(/%TOKEN:(--[\w-]+)%/g, (_, name: string) => token(name)),
    },
    // 토스 미니앱: 확대·축소 제스처를 막고(출시 체크리스트), 홈 화면 설치용 태그는 뺀다
    toss && {
      name: 'toss-html',
      transformIndexHtml: (html: string) =>
        html
          .replace('initial-scale=1.0"', 'initial-scale=1.0, maximum-scale=1.0, user-scalable=no"')
          .replace(/\s*<meta name="apple-mobile-web-app-[^>]*>/g, '')
          .replace(/\s*<link rel="apple-touch-icon"[^>]*>/g, ''),
    },
    // PWA만: 검색엔진·링크 공유 (토스 미니앱은 검색에 노출되지 않는다)
    !toss && seo(),
    !toss && VitePWA({
      // 새 버전은 받자마자 대기 없이 교체되고, 다음에 앱을 열거나 새로고침할 때 화면에 적용된다 (업데이트 안내 UI 없음).
      // 'prompt'(모든 창을 닫아야 교체)는 아이폰 홈 화면 앱처럼 창이 잘 안 닫히는 환경에서 업데이트가 계속 미뤄졌다
      registerType: 'autoUpdate',
      injectRegister: 'script-defer',
      manifest: {
        name: '카페인 신분증',
        short_name: '카페인 신분증',
        description: '먹기 전에 음식 속 카페인을 신분증으로 조회하세요.',
        lang: 'ko',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: token('--bg-inverse'),
        background_color: token('--bg-canvas'),
        // 임시 아이콘 (scripts/build-app-icons.mjs). 진짜 아이콘을 받으면 public/icons 파일만 바꾼다
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // 앱 화면·음식 DB·사진·글꼴을 처음 방문 때 모두 받아 두어 오프라인에서도 조회된다
        globPatterns: ['**/*.{js,css,html,woff2,webp,png,svg}'],
        // 링크 공유 미리보기 이미지는 앱에서 쓰지 않으니 받아 두지 않는다
        globIgnores: ['og-image.png'],
        // Pretendard 글꼴 파일이 2MB라 기본 한도(2MB)를 넘는다
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        // /item/… 같은 주소로 바로 열어도 오프라인에서 앱이 뜬다
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
      },
    }),
  ],
  // 개발 서버가 의존성을 한 번에 묶도록 (나중에 발견되면 React가 두 벌로 묶여 화면이 안 뜨는 문제가 있었다)
  optimizeDeps: { include: ['react', 'react-dom/client', 'react/jsx-dev-runtime', 'react-router-dom'] },
  }
})
