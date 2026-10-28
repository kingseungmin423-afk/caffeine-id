// 오늘 퀴즈에서 고른 답. 다른 날이 되면 지워진 것으로 본다.
const KEY = 'caffeine-id:quiz'

type Saved = { date: string; pick: 'a' | 'b' }

export const readPick = (date: string): Saved['pick'] | null => {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Saved | null
    return saved?.date === date ? saved.pick : null
  } catch {
    return null
  }
}

export const savePick = (date: string, pick: Saved['pick']) => {
  try {
    localStorage.setItem(KEY, JSON.stringify({ date, pick }))
  } catch {
    // 저장이 막힌 환경: 이번 화면 동안만
  }
}
