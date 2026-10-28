// 음식 제보(08) 전송 기준. 서버 쪽 제한은 supabase/schema.sql 과 맞춘다.

/** Supabase 주소·공개 키. app/.env.local(개발) 또는 Vercel 환경 변수(배포)에 넣는다. 없으면 기기에만 보관한다 */
export const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/$/, '') ?? ''
export const SUPABASE_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? ''
export const REPORT_BUCKET = 'report-photos'

/** 사진: 긴 변을 이만큼으로 줄이고 다시 저장한다(이때 위치 정보 등 사진 속 정보가 모두 빠진다) */
export const PHOTO_MAX_EDGE = 1280
export const PHOTO_QUALITY = 0.82
/** 서버 통 한도(2MB)보다 조금 작게. 넘으면 화질을 낮춰 한 번 더 */
export const PHOTO_MAX_BYTES = 1_800_000

/** 이름·제조사 글자 수 (서버 검사와 같다) */
export const TEXT_MAX = 60

/** 한 기기에서 하루에 보낼 수 있는 제보 수 (서버는 같은 접속 주소 1시간 5건) */
export const DAILY_LIMIT = 5
/** 화면을 연 지 이 시간(ms)도 안 돼 제출하면 사람이 아니라고 보고 조용히 버린다 */
export const MIN_FILL_MS = 2500
