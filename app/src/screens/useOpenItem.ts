import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { visits } from '../store/visits'
import { paths } from './links'

/** 음식 열기: 처음 보는 음식은 04 신분증 검사를 거치고, 이미 발급된 음식은 바로 결과로 */
export function useOpenItem() {
  const navigate = useNavigate()
  return useCallback(
    (id: string) => navigate(id in visits.get().issued ? paths.item(id) : paths.check(paths.item(id))),
    [navigate],
  )
}
