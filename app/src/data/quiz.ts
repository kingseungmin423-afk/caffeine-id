// 오늘의 카페인 비교 퀴즈: 날짜(기기 시간, 하루 단위)로 두 음식을 고른다.
// 서버 없이 매일 자동으로 바뀌고, 같은 날에는 누구나 같은 문제를 본다. 인터넷이 없어도 된다.
import { servingLabel, type Item } from './db'
import { photoFor } from './photos'

export type Quiz = { date: string; a: Item; b: Item }

/** 두 음식의 카페인 차이가 이보다 작으면 문제로 내지 않는다(mg) */
const MIN_DIFF_MG = 5
/** 많은 쪽이 적은 쪽의 이 배수를 넘으면 너무 쉬워서 내지 않는다 */
const MAX_RATIO = 4
/** 카드에 들어가는 이름 길이 */
const NAME_MAX = 10
/** 조건에 맞는 짝을 찾을 때 시도 횟수 */
const TRIES = 200

/** 오늘 날짜 'YYYY-MM-DD' (기기 시간대) */
export const today = () => new Date().toLocaleDateString('sv-SE')

/** '녹차(티백)' → '녹차' */
export const quizName = (item: Item) => item.name.replace(/\s*\([^)]*\)$/, '')

/** 받침 있으면 '과', 없으면 '와'. 한글로 끝나지 않으면 '와(과)' */
export const withAnd = (word: string) => {
  const code = word.charCodeAt(word.length - 1) - 0xac00
  if (code < 0 || code > 11171) return `${word}와(과)`
  return word + (code % 28 ? '과' : '와')
}

// 날짜 → 늘 같은 순서의 난수 (mulberry32)
const random = (seed: string) => {
  let h = 1779033703
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 3432918353)
  let a = h >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** 문제 후보: 카페인이 있고, 앱 카테고리·사진이 있고, 이름이 짧은 음식 (같은 이름은 하나만) */
function pool(items: Item[]) {
  const seen = new Set<string>()
  return items
    .filter((i) => i.caffeine && i.mg > 0 && i.app && photoFor(i.id) && quizName(i).length <= NAME_MAX && servingLabel(i.serving))
    .sort((x, y) => x.id.localeCompare(y.id))
    .filter((i) => !seen.has(quizName(i)) && seen.add(quizName(i)))
}

export function dailyQuiz(items: Item[], date = today()): Quiz | null {
  const list = pool(items)
  if (list.length < 2) return null
  const r = random(date)
  const pick = () => list[Math.floor(r() * list.length)]
  for (let n = 0; n < TRIES; n++) {
    const a = pick()
    const b = pick()
    if (a === b || photoFor(a.id) === photoFor(b.id)) continue
    const [lo, hi] = a.mg < b.mg ? [a.mg, b.mg] : [b.mg, a.mg]
    if (hi - lo >= MIN_DIFF_MG && hi / lo <= MAX_RATIO) return { date, a, b }
  }
  return { date, a: list[0], b: list[1] }
}
