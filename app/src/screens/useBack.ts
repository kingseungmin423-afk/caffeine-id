import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

/** 앱 안에서 들어온 화면이면 이전 화면으로, 바로 열린 화면이면 메인으로 */
export function useBack(fallback = '/') {
  const navigate = useNavigate()
  return useCallback(() => {
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0
    if (idx > 0) navigate(-1)
    else navigate(fallback, { replace: true })
  }, [navigate, fallback])
}
