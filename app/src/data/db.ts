// 카페인 DB (src/data/db.json, scripts/build-db.mjs가 만든다). 첫 사용 때 한 번 불러온다.
import { useEffect, useState } from 'react'
import type { Category } from './categories'

export type Confidence =
  | 'official'
  | 'package_label'
  | 'official_foreign'
  | 'retail_listing'
  | 'lab_test'
  | 'official_average'
  | 'estimate_foreign_db'
  | 'ingredient_based'

export type Item = {
  id: string
  name: string
  brand: string
  /** DB 원래 분류 */
  category: string
  /** 앱 카테고리 8개 중 하나 (없으면 null) */
  app: Category | null
  serving: string
  mg: number
  caffeine: boolean
  confidence: Confidence
  checked: string
  keys: string[]
}

let cache: Item[] | null = null
let loading: Promise<Item[]> | null = null

export function loadDb(): Promise<Item[]> {
  if (cache) return Promise.resolve(cache)
  loading ??= import('./db.json').then((m) => (cache = m.default.items as Item[]))
  return loading
}

/** DB를 불러오는 동안은 null */
export function useDb(): Item[] | null {
  const [items, setItems] = useState(cache)
  useEffect(() => {
    if (!items) loadDb().then(setItems)
  }, [items])
  return items
}

export const findItem = (items: Item[], id: string) => items.find((i) => i.id === id) ?? null

// ---------- 표시용 ----------

/** '355ml (12 fl oz, 미국 제품 기준)' → '355ml', '이 약 1정(589.3 밀리그램) 중' → '1정' */
export const servingLabel = (serving: string) =>
  serving
    .replace(/^이 약\s*/, '')
    .replace(/\s*\([^)]*\)/g, '')
    .replace(/\s*중$/, '')
    .trim()

/** '탄산음료 · 355ml' */
export const metaLabel = (item: Item) => [item.app ?? item.category, servingLabel(item.serving)].filter(Boolean).join(' · ')

/** 소수점이 있는 값은 한 자리까지 */
export const mgLabel = (mg: number) => `${Number.isInteger(mg) ? mg : Math.round(mg * 10) / 10}mg`

/** 100ml(또는 100g)당 함량. 기준량에서 ml·g을 읽을 수 없으면 null */
export function per100(item: Item): string | null {
  const m = servingLabel(item.serving).match(/([\d.]+)\s*(ml|mL|g)\b/)
  if (!m) return null
  const amount = parseFloat(m[1])
  if (!amount) return null
  return `${mgLabel((item.mg / amount) * 100)}`
}

// ---------- 검색 ----------

export const normalize = (s: string) => s.toLowerCase().replace(/[\s·()[\]{}\-_.,/]+/g, '')

/** 띄어쓰기를 무시하고 이름·별칭(포함), 브랜드·'제조사+이름' 별칭(앞부분 일치)에서 찾는다. 정확도순: 같음 > 앞부분 일치 > 포함, 같으면 이름이 짧은 순 */
export function search(items: Item[], query: string): Item[] {
  const q = normalize(query)
  if (!q) return []
  const scored: { item: Item; score: number }[] = []
  for (const item of items) {
    let score = 0
    for (const key of item.keys) {
      // '@' 브랜드, '^' 제조사+이름 별칭: 앞부분이 맞을 때만
      const prefixOnly = key.startsWith('@') || key.startsWith('^')
      const k = prefixOnly ? key.slice(1) : key
      if (prefixOnly && !k.startsWith(q)) continue
      if (k === q) score = Math.max(score, 3)
      else if (k.startsWith(q)) score = Math.max(score, 2)
      else if (k.includes(q)) score = Math.max(score, 1)
    }
    if (score) scored.push({ item, score })
  }
  return scored.sort((a, b) => b.score - a.score || a.item.name.length - b.item.name.length || a.item.name.localeCompare(b.item.name, 'ko')).map((s) => s.item)
}

/**
 * DB에 없는 음식의 추정: 이름을 낱말로 나눠, 낱말이 들어간 음식을 비슷한 음식으로 본다.
 * 한국어 음식 이름은 끝 낱말이 음식 종류라서('말차 쿠키'의 '쿠키') 끝 낱말이 맞는 음식이 있으면 그것만 쓴다.
 */
export function similarItems(items: Item[], query: string, limit = 3): Item[] {
  const words = query.split(/\s+/).map(normalize).filter((w) => w.length >= 2)
  if (!words.length) return []
  const has = (item: Item, w: string) => item.keys.some((k) => !k.startsWith('@') && !k.startsWith('^') && k.includes(w))
  const head = words[words.length - 1]
  const pool = items.some((i) => has(i, head)) ? items.filter((i) => has(i, head)) : items
  const scored = pool.map((item) => ({ item, hits: words.filter((w) => has(item, w)).length })).filter((s) => s.hits > 0)
  return scored.sort((a, b) => b.hits - a.hits || a.item.name.length - b.item.name.length).slice(0, limit).map((s) => s.item)
}
