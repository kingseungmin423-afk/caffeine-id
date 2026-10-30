// 북마크 (기기에 저장). 05 결과 상단 오른쪽에서 켜고 끄고, 02-2 카테고리 상세에서 맨 위에 보여 준다 (2026-10-31 사용자 요청, 피그마에 없음).
import { useSyncExternalStore } from 'react'

const KEY = 'caffeine-id:bookmarks'

const read = (): string[] => {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

/** 북마크한 음식 id (최근에 북마크한 것이 앞) */
let state = read()
const listeners = new Set<() => void>()

const write = (next: string[]) => {
  state = next
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // 저장이 막힌 환경(시크릿 모드 등)에서는 이번 실행 동안만 기억한다
  }
  listeners.forEach((l) => l())
}

export const bookmarks = {
  get: () => state,
  subscribe: (l: () => void) => {
    listeners.add(l)
    return () => listeners.delete(l)
  },
  toggle(id: string) {
    write(state.includes(id) ? state.filter((b) => b !== id) : [id, ...state])
  },
}

export const useBookmarks = () => useSyncExternalStore(bookmarks.subscribe, bookmarks.get)
