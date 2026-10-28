// 기기에 저장하는 조회 기록: 발급 번호(조회한 순서), 최근 조회, 온보딩 완료.
import { useSyncExternalStore } from 'react'

type State = {
  /** 음식 id → 발급 번호 (처음 조회한 순서, 1부터) */
  issued: Record<string, number>
  /** 최근 조회 id (최신이 앞) */
  recent: string[]
  onboarded: boolean
}

const KEY = 'caffeine-id:visits'
const RECENT_MAX = 20
const empty: State = { issued: {}, recent: [], onboarded: false }

const read = (): State => {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? { ...empty, ...JSON.parse(raw) } : empty
  } catch {
    return empty
  }
}

let state = read()
const listeners = new Set<() => void>()

const write = (next: State) => {
  state = next
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // 저장이 막힌 환경(시크릿 모드 등)에서는 이번 실행 동안만 기억한다
  }
  listeners.forEach((l) => l())
}

export const visits = {
  get: () => state,
  subscribe: (l: () => void) => {
    listeners.add(l)
    return () => listeners.delete(l)
  },
  /** 조회 결과를 봤을 때: 처음이면 발급 번호를 주고, 최근 목록 맨 앞에 둔다 */
  view(id: string) {
    const issued = id in state.issued ? state.issued : { ...state.issued, [id]: Object.keys(state.issued).length + 1 }
    write({ ...state, issued, recent: [id, ...state.recent.filter((r) => r !== id)].slice(0, RECENT_MAX) })
  },
  finishOnboarding() {
    write({ ...state, onboarded: true })
  },
}

export const useVisits = () => useSyncExternalStore(visits.subscribe, visits.get)
