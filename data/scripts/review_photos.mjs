// review_photos.py와 같은 점검을 Node로 (Python이 없는 PC용). 실행: node data/scripts/review_photos.mjs
// assets/photos/credits.json 의 사진마다 위키미디어 원본 페이지를 다시 조회해 저작권 위험 신호를 점검한다.
// 결과: assets/photos/license_review.csv  (항목·판정 기준은 review_photos.py와 같다)
//
// 점검 항목
// - license_now : 지금 원본 페이지의 라이선스 (받을 때와 같은지)
// - deletion    : 삭제 요청·저작권 침해 신고·허가 없음 표시가 붙어 있는지
// - review      : Flickr 등 외부에서 옮겨온 사진이면 라이선스 확인(리뷰)을 통과했는지
// - trademark   : 상표 경고(Trademarked) 표시
// - personality : 초상권 경고(Personality rights) 표시
// - artist      : 작가 표기가 있는지
// 추가(앱 쪽): 앱이 쓰는 사진(app/src/data/photos.json)이 모두 출처 목록에 있고 표기 문구가 같은지
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const PHOTOS = resolve(here, '../../assets/photos')
const APP_PHOTOS = resolve(here, '../../app/src/data/photos.json')
const UA = { 'User-Agent': 'caffeine-finder-student-project/0.1 (portfolio)' }

const DELETION = /(Deletion requests|Copyright violations|Candidates for speedy deletion|Media without a license|Media missing permission|Media without a source|Possible copyright violations|Flickr images with bad license|License review needed)/i
// 업로드 봇은 올릴 때 Flickr 라이선스를 기록
const REVIEW_OK = /(Flickr images reviewed|Flickr review|reviewed by FlickreviewR|License review passed|Files with license review|FlickrUploaderReview|Flickr upload bot)/i
const REVIEW_NEEDED = /(Flickr images needing human review|Unreviewed|review needed)/i

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function api(params) {
  const url = 'https://commons.wikimedia.org/w/api.php?' + new URLSearchParams({ format: 'json', ...params })
  for (let i = 0; i < 5; i++) {
    try {
      const res = await fetch(url, { headers: UA, signal: AbortSignal.timeout(40000) })
      if (res.ok) return await res.json()
    } catch {
      // 잠시 뒤 다시
    }
    await sleep(5000 * (i + 1))
  }
  throw new Error('API 실패')
}

const rows = JSON.parse(readFileSync(resolve(PHOTOS, 'credits.json'), 'utf8'))
const out = []
for (const r of rows) {
  // 오픈푸드팩츠 사진(2026-10-31~): 제품 사진 전체가 CC BY-SA 3.0. 제품 페이지가 아직 있는지만 본다
  if (r.source_page.includes('openfoodfacts.org')) {
    const code = r.source_page.split('/product/')[1]
    let ok = false
    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${code}?fields=code`, { headers: UA, signal: AbortSignal.timeout(40000) })
      ok = res.ok && (await res.json()).status === 1
    } catch {
      // 접속 실패는 아래에서 '확인 못 함'
    }
    const row = {
      photo_key: r.photo_key, title: r.title, license_then: r.license, license_now: ok ? 'CC BY-SA 3.0' : '',
      license_same: ok, deletion: '', from_flickr: false, review: '해당 없음', trademark: true, personality: false,
      artist: true, restrictions: '', status: ok ? '문제 없음' : '제품 페이지 확인 못 함',
      trademark_note: '상표 있음(제품 식별 용도로만)',
    }
    out.push(row)
    console.log(r.photo_key, row.status, '(오픈푸드팩츠)')
    await sleep(1000)
    continue
  }
  const d = await api({
    action: 'query', titles: 'File:' + r.title, prop: 'imageinfo|categories|templates',
    iiprop: 'extmetadata', cllimit: 'max', tllimit: 'max', tlnamespace: '10',
  })
  const page = Object.values(d.query.pages)[0]
  if ('missing' in page) {
    out.push({ photo_key: r.photo_key, title: r.title, status: '원본 페이지 없음(삭제됨?)' })
    console.log(r.photo_key, '원본 페이지 없음(삭제됨?)')
    continue
  }
  const m = page.imageinfo[0].extmetadata
  const cats = (page.categories ?? []).map((c) => c.title.replace('Category:', ''))
  const tpls = (page.templates ?? []).map((t) => t.title.replace('Template:', ''))
  const alltext = [...cats, ...tpls].join(' | ')
  const licNow = m.LicenseShortName?.value ?? ''
  const restr = m.Restrictions?.value ?? ''
  const fromFlickr = ((m.Credit?.value ?? '') + alltext).toLowerCase().includes('flickr')
  const row = {
    photo_key: r.photo_key, title: r.title,
    license_then: r.license, license_now: licNow,
    license_same: licNow.replace(/ /g, '').toLowerCase() === r.license.replace(/ /g, '').toLowerCase(),
    deletion: cats.filter((c) => DELETION.test(c)).join('; '),
    from_flickr: fromFlickr,
    review: REVIEW_OK.test(alltext) ? '통과' : REVIEW_NEEDED.test(alltext) ? '확인 필요' : fromFlickr ? '기록 없음' : '해당 없음',
    trademark: (restr + alltext).toLowerCase().includes('trademark'),
    personality: (restr + alltext).toLowerCase().includes('personality'),
    artist: (m.Artist?.value ?? '').replace(/<[^>]+>/g, '').trim() !== '',
    restrictions: restr,
  }
  const flags = []
  if (!row.license_same) flags.push('라이선스 바뀜')
  if (row.deletion) flags.push('삭제·침해 표시')
  if (row.review === '확인 필요' || row.review === '기록 없음') flags.push('외부 사진 라이선스 미확인')
  if (row.personality) flags.push('초상권 경고')
  if (!row.artist && licNow.includes('CC BY')) flags.push('작가 표기 없음')
  row.status = flags.join(', ') || '문제 없음'
  row.trademark_note = row.trademark || r.photo_key.startsWith('brand_') ? '상표 있음(제품 식별 용도로만)' : ''
  out.push(row)
  console.log(r.photo_key, row.status, row.trademark_note)
  await sleep(1000)
}

// CSV (review_photos.py와 같은 열 순서, 엑셀에서 한글이 깨지지 않게 BOM)
const keys = Object.keys(out.find((o) => 'license_now' in o) ?? out[0])
for (const o of out) for (const k of Object.keys(o)) if (!keys.includes(k)) keys.push(k)
const cell = (v) => {
  const s = v === undefined ? '' : v === true ? 'True' : v === false ? 'False' : String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}
writeFileSync(resolve(PHOTOS, 'license_review.csv'), '﻿' + [keys.join(','), ...out.map((o) => keys.map((k) => cell(o[k])).join(','))].join('\r\n') + '\r\n')

// 앱 쪽: 앱이 쓰는 사진이 모두 출처 목록에 있고, 표기(작가·라이선스·수정 여부)가 같은지
const app = JSON.parse(readFileSync(APP_PHOTOS, 'utf8')).photos
const byKey = Object.fromEntries(rows.map((r) => [r.photo_key, r]))
const appIssues = []
for (const [key, p] of Object.entries(app)) {
  const c = byKey[key]
  if (!c) { appIssues.push(`${key}: 출처 목록(credits.json)에 없음`); continue }
  if (p.credit !== c.credit) appIssues.push(`${key}: 표기 문구가 다름`)
  if ((p.modified ?? '') !== (c.modified ?? '')) appIssues.push(`${key}: 수정 표시가 다름`)
  if (/CC BY/.test(c.license) && !c.license_url) appIssues.push(`${key}: 라이선스 주소 없음`)
}
const flagged = out.filter((o) => o.status !== '문제 없음')
console.log(`\n사진 ${out.length}장 점검: 문제 ${flagged.length}장`)
for (const o of flagged) console.log(`  - ${o.photo_key}: ${o.status}`)
console.log(`앱 표기 점검: ${Object.keys(app).length}장, 문제 ${appIssues.length}건`)
for (const i of appIssues) console.log('  - ' + i)
