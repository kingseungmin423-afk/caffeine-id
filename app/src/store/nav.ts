// 화면 이동 기억: 화면별 스크롤 위치, '조회' 탭이 돌아갈 마지막 화면.
// 새로고침해도 이번 방문 동안은 남도록 sessionStorage에 둔다.

const SCROLL_KEY = 'caffeine-id:scroll'
const LOOKUP_KEY = 'caffeine-id:last-lookup'

const read = <T>(key: string, empty: T): T => {
  try {
    const raw = sessionStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : empty
  } catch {
    return empty
  }
}
const write = (key: string, value: unknown) => {
  try {
    sessionStorage.setItem(key, JSON.stringify(value))
  } catch {
    // 저장이 막힌 환경에서는 이번 화면 동안만 기억한다
  }
}

/** 화면 기록(history 항목)마다 스크롤 위치 */
const scrolls: Record<string, number> = read(SCROLL_KEY, {})

export const saveScroll = (entryKey: string, y: number) => {
  scrolls[entryKey] = y
  write(SCROLL_KEY, scrolls)
}
export const savedScroll = (entryKey: string): number | undefined => scrolls[entryKey]

/** '조회' 탭에 속한 화면: 검색·카테고리·결과·추정 */
export const isLookupPath = (pathname: string) => /^\/(search|category|item|estimate)(\/|$)/.test(pathname)

type Lookup = { path: string; scrollY: number }
let lastLookup: Lookup | null = read(LOOKUP_KEY, null)

/** 조회 화면에 있을 때마다 주소와 스크롤을 기억해 둔다 */
export const rememberLookup = (path: string, scrollY: number) => {
  lastLookup = { path, scrollY }
  write(LOOKUP_KEY, lastLookup)
}
export const getLastLookup = () => lastLookup
