// 음식 제보 보내기. 먼저 기기 보관함(IndexedDB)에 넣고 바로 Supabase로 보낸다.
// 오프라인이거나 실패하면 보관함에 남겨 두었다가 인터넷이 다시 연결되거나 앱을 다시 열 때 자동으로 보낸다.
// 사진은 줄여서 다시 저장해 위치 정보(EXIF)를 없앤 뒤 보낸다. 개인 정보는 보내지 않는다.
import {
  DAILY_LIMIT,
  MIN_FILL_MS,
  PHOTO_MAX_BYTES,
  PHOTO_MAX_EDGE,
  PHOTO_QUALITY,
  REPORT_BUCKET,
  SUPABASE_URL,
  TEXT_MAX,
} from '../config/report'
import { supabaseConfigured, supabaseHeaders } from './supabase'

export type ReportDraft = { name: string; maker: string; category: string; photo: File | null }
/** 봇 막기용: 화면을 연 시각, 사람에게는 안 보이는 칸에 들어온 값 */
export type ReportGuard = { openedAt: number; trap: string }
/** sent = 보냄, queued = 기기에 보관(연결되면 자동 전송), limited = 너무 많이 보냄, failed = 서버가 받지 않음 */
export type ReportResult = 'sent' | 'queued' | 'limited' | 'failed'

type Outgoing = {
  id: string
  name: string
  maker: string
  category: string
  photo: Blob | null
  createdAt: number
}

// ---------- 기기 보관함 (IndexedDB: 사진 같은 큰 파일도 넣을 수 있다) ----------
const DB_NAME = 'caffeine-id'
const STORE = 'report-outbox'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'id' })
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function tx<T>(mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const req = run(db.transaction(STORE, mode).objectStore(STORE))
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

const outbox = {
  put: (item: Outgoing) => tx('readwrite', (s) => s.put(item)),
  remove: (id: string) => tx('readwrite', (s) => s.delete(id)),
  all: () => tx<Outgoing[]>('readonly', (s) => s.getAll()),
}

// ---------- 하루 보낸 수 (기기 기준) ----------
const SENT_KEY = 'caffeine-id:report-sent'
const DAY_MS = 24 * 60 * 60 * 1000

function recentSends(): number[] {
  try {
    const list: number[] = JSON.parse(localStorage.getItem(SENT_KEY) ?? '[]')
    return list.filter((t) => Date.now() - t < DAY_MS)
  } catch {
    return []
  }
}

function countSend() {
  try {
    localStorage.setItem(SENT_KEY, JSON.stringify([...recentSends(), Date.now()]))
  } catch {
    // 저장이 막힌 브라우저: 서버 제한만 적용된다
  }
}

// ---------- 사진 줄이기 (다시 그려 저장하면 위치 정보 등 사진 속 정보가 빠진다) ----------
function loadImage(file: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('image'))
    }
    img.src = url
  })
}

const toBlob = (canvas: HTMLCanvasElement, type: string, quality: number) =>
  new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality))

async function shrinkPhoto(file: File): Promise<Blob | null> {
  try {
    // 브라우저가 사진 방향(EXIF 회전)을 적용해서 그려 준다
    const img = await loadImage(file)
    const scale = Math.min(1, PHOTO_MAX_EDGE / Math.max(img.naturalWidth, img.naturalHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(img.naturalWidth * scale)
    canvas.height = Math.round(img.naturalHeight * scale)
    canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
    // webp가 안 되는 브라우저(아이폰 사파리)는 jpeg로
    for (const quality of [PHOTO_QUALITY, PHOTO_QUALITY / 2]) {
      let blob = await toBlob(canvas, 'image/webp', quality)
      if (blob?.type !== 'image/webp') blob = await toBlob(canvas, 'image/jpeg', quality)
      if (blob && blob.size <= PHOTO_MAX_BYTES) return blob
    }
  } catch {
    // 읽을 수 없는 사진: 사진 없이 보낸다
  }
  return null
}

// ---------- 보내기 ----------
// crypto.randomUUID는 https에서만 된다 (휴대폰으로 http 개발 서버를 볼 때를 위해)
function uuid() {
  const b = crypto.getRandomValues(new Uint8Array(16))
  b[6] = (b[6] & 0x0f) | 0x40
  b[8] = (b[8] & 0x3f) | 0x80
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('')
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
}

const configured = supabaseConfigured
const headers = supabaseHeaders

/** 한 건 보내기. 'retry' = 나중에 다시 (인터넷 문제·서버 일시 오류) */
async function sendOne(item: Outgoing): Promise<'sent' | 'limited' | 'failed' | 'retry'> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/reports`, {
      method: 'POST',
      headers: headers({ 'Content-Type': 'application/json', Prefer: 'return=minimal' }),
      body: JSON.stringify({ id: item.id, name: item.name, maker: item.maker, category: item.category, has_photo: !!item.photo }),
    })
    // 409 = 이미 들어간 제보(사진만 못 올렸던 경우)
    if (!res.ok && res.status !== 409) {
      const text = await res.text()
      if (text.includes('rate_limited')) return 'limited'
      return res.status >= 500 || res.status === 429 ? 'retry' : 'failed'
    }
    if (item.photo) {
      const ext = item.photo.type === 'image/webp' ? 'webp' : 'jpg'
      const up = await fetch(`${SUPABASE_URL}/storage/v1/object/${REPORT_BUCKET}/${item.id}.${ext}`, {
        method: 'POST',
        headers: headers({ 'Content-Type': item.photo.type }),
        body: item.photo,
      })
      // 이미 올라간 사진(중복)은 성공으로 본다. 그 밖의 실패는 제보 글은 들어갔으니 사진만 포기한다
      if (!up.ok && up.status >= 500) return 'retry'
    }
    return 'sent'
  } catch {
    return 'retry'
  }
}

let flushing: Promise<void> | null = null

/** 보관함에 남은 제보를 보낸다. 앱 시작·인터넷 연결 때 자동으로 부른다 */
export function flushReports(): Promise<void> {
  if (!configured() || !navigator.onLine) return Promise.resolve()
  flushing ??= (async () => {
    try {
      for (const item of await outbox.all()) {
        const r = await sendOne(item)
        if (r !== 'retry') await outbox.remove(item.id)
      }
    } catch {
      // 보관함을 못 여는 브라우저
    } finally {
      flushing = null
    }
  })()
  return flushing
}

/** main.tsx에서 앱 시작 때 한 번 */
export function startReportSync() {
  void flushReports()
  window.addEventListener('online', () => void flushReports())
}

export async function submitReport(draft: ReportDraft, guard: ReportGuard): Promise<ReportResult> {
  // 봇: 안 보이는 칸을 채웠거나 너무 빨리 냈다 → 보낸 것처럼 보여 주고 버린다
  if (guard.trap !== '' || Date.now() - guard.openedAt < MIN_FILL_MS) return 'sent'
  if (recentSends().length >= DAILY_LIMIT) return 'limited'

  const item: Outgoing = {
    id: uuid(),
    name: draft.name.slice(0, TEXT_MAX),
    maker: draft.maker.slice(0, TEXT_MAX),
    category: draft.category,
    photo: draft.photo ? await shrinkPhoto(draft.photo) : null,
    createdAt: Date.now(),
  }

  try {
    await outbox.put(item)
  } catch {
    // 보관함을 못 쓰는 브라우저: 바로 보내기만 시도한다
  }
  countSend()
  if (!configured() || !navigator.onLine) return 'queued'

  const r = await sendOne(item)
  if (r !== 'retry') await outbox.remove(item.id).catch(() => {})
  return r === 'retry' ? 'queued' : r
}
