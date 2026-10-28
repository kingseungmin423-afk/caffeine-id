// ../data/caffeine_db.json → src/data/db.json (앱에서 쓰는 필드만, 앱 카테고리·검색어를 미리 계산)
// 카테고리 대응표: src/data/category-rules.json
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const src = JSON.parse(readFileSync(resolve(root, '../data/caffeine_db.json'), 'utf8'))
const { rules } = JSON.parse(readFileSync(resolve(root, 'src/data/category-rules.json'), 'utf8'))

// 검색용: 띄어쓰기·기호를 빼고 소문자로
const norm = (s) => s.toLowerCase().replace(/[\s·()[\]{}\-_.,/]+/g, '')

const appCategory = (x) => {
  for (const r of rules) {
    if (r.category && !r.category.includes(x.category)) continue
    if (r.subcategory && !r.subcategory.includes(x.subcategory)) continue
    if (r.brand && !r.brand.includes(x.brand)) continue
    if (r.name && !new RegExp(r.name).test(x.name_ko)) continue
    return r.app
  }
  return null
}

const items = src.items.map((x) => ({
  id: x.id,
  name: x.name_ko,
  brand: x.brand,
  category: x.category,
  app: appCategory(x),
  serving: x.serving,
  mg: x.caffeine_mg,
  caffeine: x.has_caffeine,
  confidence: x.confidence,
  checked: x.checked_at,
  // 검색 키: 이름 + 별칭. 브랜드는 '@'를 붙여 따로 (앞부분이 맞을 때만 찾는다: '콜라' → 코카-콜라음료의 몬스터 제외)
  keys: [...new Set([x.name_ko, ...x.aliases.split(';')].filter(Boolean).map(norm))].concat(x.brand ? ['@' + norm(x.brand)] : []),
}))

const counts = {}
for (const i of items) counts[i.app ?? '(없음)'] = (counts[i.app ?? '(없음)'] ?? 0) + 1
writeFileSync(resolve(root, 'src/data/db.json'), JSON.stringify({ version: src.version, items }))
console.log(`db.json: ${items.length}개`, counts)
