// '많이 찾는 순' 정렬용 음식별 조회 수 (전체 사용자, Supabase item_views — supabase/item-views.sql).
// 보낼 때는 음식 번호만 보낸다(누가 봤는지 없음). 같은 기기에서 같은 음식은 하루 1번만 보낸다(서버도 한 번 더 막는다).
// 서버에 연결되지 않으면(오프라인·키 없음·표가 아직 없음) 조용히 넘어가고, 정렬은 가나다순으로 대신한다.
import { useSyncExternalStore } from 'react'
import { supabaseConfigured, supabaseHeaders, supabaseUrl } from './supabase'

const SENT_KEY = 'caffeine-id:views-sent'
/** 한 번 받아 온 조회 수를 다시 받기까지 (ms) */
const REFRESH_MS = 10 * 60 * 1000

const today = () => new Date().toISOString().slice(0, 10)

/** 결과 화면을 볼 때 부른다 */
export function recordView(itemId: string) {
  if (!supabaseConfigured() || !navigator.onLine) return
  try {
    const sent: { day: string; ids: string[] } = JSON.parse(localStorage.getItem(SENT_KEY) ?? 'null') ?? { day: '', ids: [] }
    const list = sent.day === today() ? sent.ids : []
    if (list.includes(itemId)) return
    localStorage.setItem(SENT_KEY, JSON.stringify({ day: today(), ids: [...list, itemId] }))
  } catch {
    // 저장이 막힌 브라우저: 서버 쪽 하루 1번 제한만 적용된다
  }
  void fetch(supabaseUrl('/rest/v1/rpc/record_view'), {
    method: 'POST',
    headers: supabaseHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ p_item_id: itemId }),
    keepalive: true,
  }).catch(() => {})
}

// ---------- 받아 오기 ----------
let counts: Map<string, number> | null = null
let loadedAt = 0
let loading: Promise<void> | null = null
const listeners = new Set<() => void>()

function load() {
  if (!supabaseConfigured() || !navigator.onLine) return
  if (loading || (counts && Date.now() - loadedAt < REFRESH_MS)) return
  loading = fetch(supabaseUrl('/rest/v1/item_views?select=item_id,views&views=gt.0'), { headers: supabaseHeaders() })
    .then((res) => (res.ok ? (res.json() as Promise<{ item_id: string; views: number }[]>) : Promise.reject(res.status)))
    .then((rows) => {
      counts = new Map(rows.map((r) => [r.item_id, r.views]))
      loadedAt = Date.now()
      listeners.forEach((l) => l())
    })
    .catch(() => {})
    .finally(() => {
      loading = null
    })
}

/** 음식별 조회 수. 아직 못 받았거나 받을 수 없으면 null */
export function useViewCounts(): Map<string, number> | null {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      load()
      return () => listeners.delete(l)
    },
    () => counts,
  )
}
