// Supabase 연결 공통 (제보 보내기·조회 수). 주소·공개 키는 config/report.ts (환경 변수)
import { SUPABASE_KEY, SUPABASE_URL } from '../config/report'

export const supabaseConfigured = () => SUPABASE_URL !== '' && SUPABASE_KEY !== ''

export function supabaseHeaders(extra: Record<string, string> = {}) {
  // 예전 공개 키(eyJ…)는 Authorization에도 넣어야 하고, 새 공개 키(sb_publishable_…)는 apikey만으로 된다
  const auth: Record<string, string> = SUPABASE_KEY.startsWith('eyJ') ? { Authorization: `Bearer ${SUPABASE_KEY}` } : {}
  return { apikey: SUPABASE_KEY, ...auth, ...extra }
}

export const supabaseUrl = (path: string) => `${SUPABASE_URL}${path}`
