// 토스 미니앱 전용: 토스 앱 기능(내비게이션 바 등)을 부른다.
// 반드시 `if (IS_TOSS) import('../toss/bridge')`처럼 불러서 PWA 빌드에는 들어가지 않게 한다.
// 일반 브라우저(로컬 개발)에는 토스 앱 연결이 없으므로 실패해도 화면은 그대로 둔다.
import { NavigationBar } from '@apps-in-toss/web-framework'

/** 토스 내비게이션 바를 화면 배경에 맞춘다. 밝은 화면 = 크림 바·어두운 글자, 어두운 화면 = 남색 바·흰 글자 */
export function matchNavigationBar(theme: 'Light' | 'Dark', backgroundColor: string) {
  NavigationBar.setOptions({ backgroundColor, theme: theme === 'Dark' ? 'dark' : 'light' }).catch(() => {})
}
