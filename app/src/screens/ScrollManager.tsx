// 스크롤 위치: 새 화면은 맨 위, 뒤로가기·앞으로가기는 떠났던 위치, '조회' 탭으로 돌아오면 그 화면의 위치.
// 조회 화면의 주소·스크롤은 '조회' 탭이 돌아갈 곳으로 기억해 둔다.
import { useEffect } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'
import { isLookupPath, rememberLookup, saveScroll, savedScroll } from '../store/nav'

/** 내용(DB 목록 등)이 늦게 그려져도 목표 위치까지 내려갈 수 있도록 잠시 다시 시도한다 */
const RESTORE_FRAMES = 60

export function ScrollManager() {
  const location = useLocation()
  const type = useNavigationType()
  const state = location.state as { scrollY?: number } | null

  useEffect(() => {
    const target = type === 'POP' ? (savedScroll(location.key) ?? 0) : (state?.scrollY ?? 0)
    let frame = 0
    let raf = 0
    const tick = () => {
      window.scrollTo(0, target)
      if (Math.abs(window.scrollY - target) > 1 && ++frame < RESTORE_FRAMES) raf = requestAnimationFrame(tick)
    }
    tick()
    return () => cancelAnimationFrame(raf)
  }, [location.key, type, state?.scrollY])

  useEffect(() => {
    const path = location.pathname + location.search
    const lookup = isLookupPath(location.pathname)
    if (lookup) rememberLookup(path, window.scrollY)
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        saveScroll(location.key, window.scrollY)
        if (lookup) rememberLookup(path, window.scrollY)
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [location.key, location.pathname, location.search])

  return null
}
