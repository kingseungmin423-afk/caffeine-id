// PC에서 마우스로 끌어 가로로 넘기기. 폰(터치)은 브라우저 기본 스와이프를 그대로 쓴다.
// 끌다가 놓으면 조금 더 미끄러지고, 카드 단위 멈춤(CSS scroll-snap)이 가까운 카드에 맞춘다.
// 끌었을 때는 손을 뗀 자리의 카드가 열리지 않도록 그 클릭을 막는다.
// 쓰는 법: const ref = useDragScroll<HTMLDivElement>() → <div ref={ref} className="drag-scroll …">
// (데이터를 불러온 뒤에 그려지는 줄도 붙도록 콜백 ref로 받는다)
import { useEffect, useState } from 'react'
import { DRAG_MOMENTUM_MS, DRAG_THRESHOLD } from '../config/motion'

export function useDragScroll<T extends HTMLElement>() {
  const [el, setEl] = useState<T | null>(null)

  useEffect(() => {
    if (!el) return
    let active = false
    let moved = false
    let startX = 0
    let startLeft = 0
    let lastX = 0
    let lastT = 0
    let velocity = 0

    const down = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return
      active = true
      moved = false
      startX = lastX = e.clientX
      startLeft = el.scrollLeft
      lastT = e.timeStamp
      velocity = 0
    }
    const move = (e: PointerEvent) => {
      if (!active) return
      const dx = e.clientX - startX
      if (!moved && Math.abs(dx) > DRAG_THRESHOLD) {
        moved = true
        el.setPointerCapture(e.pointerId)
        el.dataset.dragging = 'true'
      }
      if (!moved) return
      e.preventDefault()
      el.scrollLeft = startLeft - dx
      const dt = e.timeStamp - lastT
      if (dt > 0) velocity = (e.clientX - lastX) / dt
      lastX = e.clientX
      lastT = e.timeStamp
    }
    const up = () => {
      if (!active) return
      active = false
      if (!moved) return
      delete el.dataset.dragging
      el.scrollBy({ left: -velocity * DRAG_MOMENTUM_MS, behavior: 'smooth' })
      const block = (ev: Event) => {
        ev.preventDefault()
        ev.stopPropagation()
      }
      el.addEventListener('click', block, { capture: true, once: true })
      setTimeout(() => el.removeEventListener('click', block, { capture: true }))
    }

    el.addEventListener('pointerdown', down)
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up)
    el.addEventListener('pointercancel', up)
    return () => {
      el.removeEventListener('pointerdown', down)
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', up)
      el.removeEventListener('pointercancel', up)
    }
  }, [el])

  return setEl
}
