import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'
import { VitePWA } from 'vite-plugin-pwa'
import tokenValues from './src/styles/tokens.resolved.json'

// 앱 정보(manifest)의 색은 피그마 토큰에서 (npm run tokens가 만든 값)
const tokens = tokenValues as Record<string, string | number>
const token = (name: string) => String(tokens[name])

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    // 아이콘 SVG를 `?react`로 불러오면 React 컴포넌트가 된다 (currentColor로 토큰 색 적용)
    react(),
    svgr(),
    // index.html의 %TOKEN:--이름% 자리에 토큰 값을 넣는다 (theme-color 등)
    {
      name: 'html-tokens',
      transformIndexHtml: (html) => html.replace(/%TOKEN:(--[\w-]+)%/g, (_, name: string) => token(name)),
    },
    VitePWA({
      // 새 버전은 받자마자 대기 없이 교체되고, 다음에 앱을 열거나 새로고침할 때 화면에 적용된다 (업데이트 안내 UI 없음).
      // 'prompt'(모든 창을 닫아야 교체)는 아이폰 홈 화면 앱처럼 창이 잘 안 닫히는 환경에서 업데이트가 계속 미뤄졌다
      registerType: 'autoUpdate',
      injectRegister: 'script-defer',
      manifest: {
        name: '카페인 신원조회',
        short_name: '카페인 신원조회',
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
})
