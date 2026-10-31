// 사진-음식 연결 정리 (2026-11-01 사용자 요청: "음식에 맞는 적절한 이미지만, 억지로 다 넣지 말 것").
// 한 장을 여러 음식에 같이 쓰는 '종류 사진'은 사진이 실제로 보여 주는 음식에만 남긴다.
//  - 이름에서 크기·온도·매장 접두어(L/EX, Hot/Cold, 아이스, 디카페인…)를 뺀 '기본 이름'이 OK 목록과 같아야 한다 → 맛·재료가 더 붙은 메뉴(바닐라·헤이즐넛·민트…)는 뗀다
//  - 온도가 정해진 사진은 같은 온도 메뉴에만 (따뜻한 아메리카노 사진 ↔ 아이스 메뉴 X)
//  - 브랜드 사진은 그 제품에만 (제로·다른 맛 X), 브랜드 없는 일반 음식에 브랜드 사진 X
//  - 약은 제형 사진(알약·캡슐·시럽·드링크병)이라 같은 제형이면 그대로 둔다
// 여기 없는 사진(한 음식에만 연결된 것)은 손대지 않는다. DROP의 연결은 모두 뗀다.
// 실행: node data/scripts/tidy_photo_links.mjs → cd app && npm run photos
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const items = Object.fromEntries(JSON.parse(readFileSync(resolve(root, 'app/src/data/db.json'), 'utf8')).items.map((i) => [i.id, i]))
const credPath = resolve(root, 'assets/photos/credits.json')
const credits = JSON.parse(readFileSync(credPath, 'utf8'))

const base = (n) =>
  n
    .replace(/\(\((ESP|DRIP)\) (Hot|Cold) [LJG]\)/g, '')
    .replace(/\((Hot|Cold) [LJG]\)/g, '')
    .replace(/^\((L|EX)\)\s*/, '')
    .replace(/\((HOT|ICED|ICE|hot|ice|BASIC|SOFT)\)/g, '')
    .replace(/^(HOT|ICED)\s+/, '')
    .replace(/^(아이스|디카페인|왕메가|빽사이즈|저당|제로슈가)\s+/g, '')
    .replace(/^(아이스|디카페인)\s+/g, '')
    .replace(/\s*\d+\s?ML$/i, '')
    .replace(/\s+/g, '')
const iced = (n) => /ICED|Cold|\(ICE\)|\(ice\)|^아이스|아이스\s/.test(n)

// 사진 → { ok: 허용 기본 이름, temp: 'hot' | 'iced' | undefined, any: true면 기본 이름 상관없이 그대로(약 제형) }
const SPEC = {
  milk_tea: { ok: ['밀크티', '블랙밀크티', '로열밀크티', '로얄밀크티', '로얄밀크티라떼'] },
  cola_glass: { ok: ['콜라(국내평균)', '콜라', '다이어트콜라', '무카페인콜라'] },
  americano: { ok: ['아메리카노', '카페아메리카노', '브루드커피', '드립커피', '커피빈카노', '블랙커피(드립·아메리카노)', '커피', '전문점커피(국내평균)', '스타벅스1호점카페아메리카노'], temp: 'hot' },
  iced_americano: { ok: ['아메리카노', '카페아메리카노', '브루드커피', '드립커피', '커피빈카노', '스타벅스1호점카페아메리카노', '콜드브루', '콜드브루오리지널'], temp: 'iced' },
  espresso: { ok: ['에스프레소', '에스프레소도피오', '더블에스프레소'] },
  cafe_latte: { ok: ['카페라떼', '라떼', '카페라떼', '커피빈라떼', '스타벅스1호점카페라떼'], temp: 'hot' },
  iced_latte: { ok: ['카페라떼', '라떼', '커피빈라떼', '스타벅스1호점카페라떼'], temp: 'iced' },
  cappuccino: { ok: ['카푸치노'] },
  cafe_mocha: { ok: ['카페모카'] },
  coffee_milk: { ok: ['커피우유(국내평균)'] },
  matcha_latte: { ok: ['말차라떼', '녹차라떼', '그린티라떼', '제주말차라떼'] },
  green_tea: { ok: ['녹차', '녹차(티백)', '제주녹차', '해남녹차'] },
  black_tea: { ok: ['홍차', '블랙티', '블랙오리지널티', '잉글리쉬브렉퍼스트티'], temp: 'hot' },
  oolong_tea: { ok: ['우롱차', '우롱티', '우롱오리지널티'], temp: 'hot' },
  iced_tea: { ok: ['아이스티', '레몬아이스티', '달콤아이스티', '왕메가아이스티', '아이스티(가루·가당)'] },
  herbal_tea: { ok: ['허브차', '캐모마일', '캐모마일차', '캐모마일블렌드티'] },
  dark_chocolate: { ok: ['다크초콜릿(카카오70~85%)', '다크초콜릿(카카오60~69%)', '다크초콜릿(카카오45~59%)'] },
  milk_chocolate: { ok: ['밀크초콜릿'] },
  hot_chocolate: { ok: ['핫초코', '초코라떼', '핫/아이스초코'], temp: 'hot' },
  chocolate_milk: { ok: ['초코우유', '아이스초코', '초코라떼', '핫/아이스초코'], temp: 'iced' },
  chocolate_icecream: { ok: ['초코아이스크림'] },
  chocochip_cookie: { ok: ['초코칩쿠키'] },
  chocolate_cake: { ok: ['초코케이크'] },
  orange_juice: { ok: ['오렌지주스'] },
  cider: { ok: ['사이다(레몬라임탄산)'] },
  brand_dr_pepper: { ok: ['닥터페퍼'] },
  brand_monster: { ok: ['몬스터에너지'] },
  brand_red_bull: { ok: ['레드불에너지드링크'] },
  bubble_tea: { ok: ['블랙밀크티+펄', '흑당버블밀크티', '로얄밀크버블티', '브라운슈가시그니처밀크티+펄'] },
  strawberry_latte: { ok: ['딸기라떼'] },
  fruit_smoothie: { ok: ['딸기스무디', '딸기쉐이크'] },
  coffee_frappe: { ok: ['커피프라페', '에스프레소프라푸치노'] },
  chocolate_shake: { ok: ['리얼초코프라페'] },
  caramel_macchiato: { ok: ['카라멜마키아또', '카라멜마끼아또', '캐러멜마키아또'] },
  cream_coffee: { ok: ['아인슈페너'] },
  affogato: { ok: ['아포가토', '클래식아포가토', '아포가토오리지널'] },
  flat_white: { ok: ['플랫화이트'] },
  earl_grey: { ok: ['얼그레이', '얼그레이티', '얼그레이오리지널티'], temp: 'hot' },
  hibiscus_tea: { ok: ['히비스커스', '히비스커스블렌드티'] },
  yuzu_tea: { ok: ['유자차'] },
  ginger_tea: { ok: ['생강차'], temp: 'hot' },
  peach_iced_tea: { ok: ['복숭아아이스티'], temp: 'iced' },
  mint_tea: { ok: ['페퍼민트', '페퍼민트티'] },
  coffee_capsule: { any: true },
  apple_juice: { ok: ['사과주스', '햇사과주스'] },
  vanilla_icecream: { ok: ['바닐라아이스크림'] },
  brand_chilsung: { ok: ['칠성사이다'] },
  brand_milkis: { ok: ['밀키스'] },
  misugaru: { ok: ['미숫가루라떼', '미숫가루', '곡물라떼'] },
  nitro_cold_brew: { ok: ['리저브나이트로'] },
  instant_coffee_grounds: { ok: ['인스턴트커피(블랙)', '인스턴트커피'] },
  hojicha: { ok: ['퓨어호지차'] },
  lemonade: { ok: ['레모네이드'] },
  mojito: { ok: ['라임모히또'] },
  // 약: 제형 사진. 브랜드가 보이지 않는 알약·캡슐·시럽·약병이라 같은 제형 제품에 그대로
  pills: { any: true }, drug_capsules: { any: true }, drug_syrup: { any: true }, drug_vial: { any: true },
}
// 사진이 음식을 보여 주지 못하거나(닫힌 컵), 브랜드 없는 일반 음식에 다른 브랜드 사진, 다른 맛 제품
const DROP = new Set(['brand_starbucks', 'brand_jello_pudding', 'brand_hersheys_syrup', 'brand_nutella', 'brand_xs_cranberry'])

let removed = 0
const log = []
for (const r of credits) {
  const ids = r.item_ids.split(';').filter(Boolean)
  let keep = ids
  if (DROP.has(r.photo_key)) keep = []
  else if (SPEC[r.photo_key] && !SPEC[r.photo_key].any) {
    const s = SPEC[r.photo_key]
    keep = ids.filter((id) => {
      const n = items[id].name
      if (!s.ok.includes(base(n))) return false
      if (s.temp === 'hot' && iced(n)) return false
      if (s.temp === 'iced' && !iced(n) && !/아이스|콜드브루|초코우유|복숭아아이스티/.test(n)) return false
      return true
    })
  }
  if (keep.length !== ids.length) {
    log.push(`${r.photo_key}: ${ids.length} → ${keep.length}`)
    removed += ids.length - keep.length
    r.item_ids = keep.join(';')
  }
}
writeFileSync(credPath, JSON.stringify(credits, null, 1))
const keys = Object.keys(credits[0])
const cell = (v) => (/[",\n]/.test(String(v ?? '')) ? `"${String(v).replace(/"/g, '""')}"` : String(v ?? ''))
writeFileSync(resolve(root, 'assets/photos/credits.csv'), '﻿' + [keys.join(','), ...credits.map((r) => keys.map((k) => cell(r[k])).join(','))].join('\r\n') + '\r\n')
console.log(log.join('\n'))
console.log(`뗀 연결 ${removed}개`)
