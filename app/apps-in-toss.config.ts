// 토스 미니앱(앱인토스) 설정. `npm run build:toss`가 dist-toss를 만들고 `ait build`가 이 파일을 읽어 <appName>.ait를 만든다.
// PWA(Vercel) 빌드와는 상관없다.
import { readFileSync } from 'node:fs'
import { defineConfig } from '@apps-in-toss/web-framework/config'

// 대표 색은 피그마 토큰(어두운 화면 배경 bg/inverse)
const tokens = JSON.parse(readFileSync(new URL('./src/styles/tokens.resolved.json', import.meta.url), 'utf8'))

export default defineConfig({
  // 앱인토스 콘솔에 등록한 앱 이름과 같아야 업로드된다. 콘솔에서 정하면 여기만 바꾼다
  appName: 'caffeine-id',
  brand: { primaryColor: tokens['--bg-inverse'] },
  // 화면마다 자체 뒤로가기가 있어 토스 뒤로가기는 끈다(둘이 함께 보이면 안 된다). 홈은 탭바에 있어 끈다
  navigationBar: { withBackButton: false, withHomeButton: false, withTitle: true },
  webView: { bounces: false, pullToRefreshEnabled: false },
  permissions: [],
  webBundleDir: 'dist-toss',
})
