// 카페인이 없는 일반 탄산음료 (2026-10-31 사용자 요청: 제로 제품만 있고 일반 사이다·환타 등이 없음).
// 일반 탄산음료는 국내 포장에 카페인 표시 의무가 없고 소비자원 시험(제로음료)에도 없어서 따로 모은다.
// - 코카-콜라 본사가 '카페인 없음'이라고 직접 밝힌 제품 → official_foreign
// - 포장 원재료 표기(판매처에 올라온 표시사항)에 커피·차·과라나·카페인 같은 카페인 원료가 없는 제품 → ingredient_based (앱에서 '원재료 기준 (추정)')
// 원재료 목록 전체를 확인하지 못한 제품(탐스 쥬시 등)은 넣지 않았다.
//
// 하는 일: raw/soda_regular.csv를 쓰고, caffeine_db.json·csv 맨 끝에 아직 없는 항목만 붙인다(다시 돌려도 중복 없음).
// 이 PC에 파이썬이 없어서 Node로 붙인다. build_db.py도 soda_regular.csv를 맨 끝에 읽으므로 나중에 다시 만들어도 번호가 같다.
// 실행: node data/scripts/collect_soda.mjs → cd app && npm run db
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const DATA = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const today = new Date().toLocaleDateString('sv-SE') // 기기 시간대 날짜(YYYY-MM-DD)

const CC_FAQ = 'https://www.coca-cola.com/ie/en/about-us/faq/what-is-caffeine'
const COSTCO_CIDER_MILKIS = 'https://www.costco.co.kr/Foods/p/620743'
const COSTCO_WELCH = 'https://www.costco.co.kr/Foods/p/833572'

// [이름, 브랜드, 용량, 동의어] — 본사 FAQ 'Popular caffeine-free drinks' 목록: "Sprite and Sprite Zero", "Fanta, Fanta Grape and Fanta Zero Orange"
const FOREIGN = [
  ['스프라이트', '코카-콜라', '250ml', '사이다;스프라이트 사이다'],
  ['환타 오렌지', '코카-콜라', '250ml', '환타;환타 오렌지맛'],
  ['환타 포도', '코카-콜라', '250ml', '환타 그레이프;환타 포도맛'],
]

// [이름, 브랜드, 용량, 원재료 표기, 확인 링크, 동의어]
const INGREDIENTS = [
  ['칠성사이다', '롯데칠성음료', '250ml', '정제수, 액상과당, 백설탕, 이산화탄소, 구연산, 레몬라임향', COSTCO_CIDER_MILKIS, '사이다;칠성 사이다'],
  ['밀키스', '롯데칠성음료', '250ml',
    '정제수, 액상과당, 백설탕, 혼합분유[탈지분유(우유), 유청분할(우유)], 대두다당류, 이산화탄소, 구연산, 인산, 합성착향료(요구르트향)',
    COSTCO_CIDER_MILKIS, '밀키스 오리지널'],
  ['웰치 소다 포도', '웰치스', '355ml',
    '정제수, 기타과당, 이산화탄소, 포도농축과즙, 향료, 구연산, 식용색소 적색 제40호, 식용색소 청색 제1호, 구연산칼륨',
    COSTCO_WELCH, '웰치스;웰치스 포도;웰치스 그레이프;웰치 포도'],
]

const raw = [
  ...FOREIGN.map(([name_ko, brand, serving, aliases]) => ({
    name_ko, brand, category: '탄산음료', subcategory: '', serving, caffeine_mg: 0,
    source: '코카-콜라 본사 공식 FAQ(What is caffeine?)의 카페인 없는 음료 목록', source_url: CC_FAQ,
    checked_at: today, confidence: 'official_foreign', aliases, review: 'False',
  })),
  ...INGREDIENTS.map(([name_ko, brand, serving, ing, source_url, aliases]) => ({
    name_ko, brand, category: '탄산음료', subcategory: '', serving, caffeine_mg: 0,
    source: `원재료 기준 추정: 포장 원재료 표기(코스트코 상품 정보)에 커피·차·과라나·카페인 등 카페인 원료 없음 · ${ing}`, source_url,
    checked_at: today, confidence: 'ingredient_based', aliases, review: 'False',
  })),
]

const csvCell = (v) => {
  const s = String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}
const csvLine = (o, keys) => keys.map((k) => csvCell(o[k])).join(',')
const rawKeys = Object.keys(raw[0])
writeFileSync(resolve(DATA, 'raw/soda_regular.csv'), '﻿' + [rawKeys.join(','), ...raw.map((r) => csvLine(r, rawKeys))].join('\r\n') + '\r\n')

// build_db.py의 auto_aliases와 같은 규칙(이 항목들에 해당하는 부분): 주어진 동의어 + 띄어쓰기 없는 이름
const aliasesOf = (name, given) => {
  const out = [...given.split(';').filter(Boolean)]
  if (name.includes(' ')) out.push(name.replace(/ /g, ''))
  return [...new Set(out.filter((a) => a !== name))].join(';')
}

const dbPath = resolve(DATA, 'caffeine_db.json')
const db = JSON.parse(readFileSync(dbPath, 'utf8'))
const has = new Set(db.items.map((i) => `${i.name_ko}|${i.brand}|${i.serving}|${i.source}`))
let n = db.items.length
const added = []
for (const r of raw) {
  if (has.has(`${r.name_ko}|${r.brand}|${r.serving}|${r.source}`)) continue
  n += 1
  const item = {
    id: `caf-${String(n).padStart(5, '0')}`,
    name_ko: r.name_ko,
    aliases: aliasesOf(r.name_ko, r.aliases),
    brand: r.brand,
    category: r.category,
    subcategory: r.subcategory,
    serving: r.serving,
    caffeine_mg: 0,
    has_caffeine: false,
    confidence: r.confidence,
    source: r.source,
    source_url: r.source_url,
    checked_at: r.checked_at,
    image_key: 'soda_can',
    needs_review: false,
    notes: '',
  }
  db.items.push(item)
  added.push(item)
}
db.count = db.items.length

// build_db.py와 같은 모양으로 쓴다 (json.dump indent=1, 0.0, CSV는 BOM·True/False)
const json = JSON.stringify(db, null, 1).replace(/"caffeine_mg": (-?\d+)(?=,)/g, '"caffeine_mg": $1.0')
writeFileSync(dbPath, json)
const csvPath = resolve(DATA, 'caffeine_db.csv')
const keys = Object.keys(db.items[0])
const py = (v) => (v === true ? 'True' : v === false ? 'False' : typeof v === 'number' && Number.isInteger(v) ? `${v}.0` : v)
const lines = added.map((i) => keys.map((k) => csvCell(py(i[k]))).join(','))
if (lines.length) writeFileSync(csvPath, readFileSync(csvPath, 'utf8') + lines.join('\r\n') + '\r\n')

console.log(`soda_regular.csv ${raw.length}개, DB에 새로 붙인 항목 ${added.length}개 (전체 ${db.count})`)
for (const i of added) console.log(' ', i.id, i.name_ko, i.confidence)
