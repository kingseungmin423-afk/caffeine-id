// 설치 안내 팝업을 띄울지 정한다.
// - 안드로이드·PC 크롬/엣지/삼성 인터넷: 브라우저가 준 설치 신호(beforeinstallprompt)를 받아 두었다가 [설치] 버튼으로 설치창
// - 아이폰·아이패드: 설치창을 띄울 수 없어 '공유 → 홈 화면에 추가' 안내
// - 카카오톡·인스타그램·네이버 등 앱 안 브라우저: '다른 브라우저로 열기' 안내
// - 이미 설치된 앱(standalone)에서는 띄우지 않고, 닫으면 7일 동안 다시 띄우지 않는다
import { useSyncExternalStore } from 'react'

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> }
export type InstallKind = 'prompt' | 'ios' | 'inApp'

const KEY = 'caffeine-id:install-dismissed'
const SNOOZE_DAYS = 7
const DAY_MS = 24 * 60 * 60 * 1000

let deferred: InstallEvent | null = null
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

/** main.tsx에서 앱 시작 때 한 번. 설치 신호는 페이지가 뜨자마자 오므로 화면보다 먼저 받아 둔다 */
export function listenInstall() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferred = e as InstallEvent
    emit()
  })
  window.addEventListener('appinstalled', () => {
    deferred = null
    emit()
  })
}

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true

// 앱 안 브라우저 → 안내 문구에 쓸 앱 이름
const IN_APPS: [RegExp, string][] = [
  [/KAKAOTALK/i, '카카오톡'],
  [/NAVER\(/i, '네이버 앱'],
  [/Instagram/i, '인스타그램'],
  [/FBAN|FBAV/i, '페이스북'],
  [/Line\//i, '라인'],
]

/** 지금 열려 있는 앱 안 브라우저의 이름. 아니면 null */
export const inAppName = () => IN_APPS.find(([re]) => re.test(navigator.userAgent))?.[1] ?? null

function kind(): InstallKind | null {
  const ua = navigator.userAgent
  if (inAppName()) return 'inApp'
  if (deferred) return 'prompt'
  const ios = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  return ios ? 'ios' : null
}

function snoozed() {
  try {
    const at = Number(localStorage.getItem(KEY))
    return at > 0 && Date.now() - at < SNOOZE_DAYS * DAY_MS
  } catch {
    return false
  }
}

/** 지금 보여 줄 안내 종류. null이면 띄우지 않는다 */
export function useInstallKind(): InstallKind | null {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => (isStandalone() || snoozed() ? null : kind()),
  )
}

export function dismissInstall() {
  try {
    localStorage.setItem(KEY, String(Date.now()))
  } catch {
    // 저장이 막힌 브라우저에서는 이번 방문 동안만 닫힌다
  }
  deferred = null
  emit()
}

/** [설치] 버튼: 브라우저 설치창을 띄운다. 설치하든 취소하든 팝업은 닫는다 */
export async function promptInstall() {
  const e = deferred
  if (!e) return
  await e.prompt()
  const { outcome } = await e.userChoice
  if (outcome === 'dismissed') dismissInstall()
  else {
    deferred = null
    emit()
  }
}
