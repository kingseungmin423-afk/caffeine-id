// 화면마다 브라우저 탭 제목·검색 설명·대표 주소를 바꾼다 (검색엔진은 화면을 그린 뒤 이 값을 읽는다).
// 토스 미니앱은 검색에 노출되지 않으므로 하지 않는다.
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { IS_TOSS } from '../config/target'
import { SITE_URL } from '../config/site'
import { copy } from '../copy'

export type PageMeta = { title: string; description: string }

const setMeta = (selector: string, attr: 'content' | 'href', value: string) => {
  document.querySelector(selector)?.setAttribute(attr, value)
}

export function usePageMeta(meta?: PageMeta) {
  const { pathname, search } = useLocation()
  const title = meta ? meta.title + copy.seo.titleSuffix : copy.seo.home.title
  const description = meta?.description ?? copy.seo.home.description
  useEffect(() => {
    if (IS_TOSS) return
    // 검색 결과 화면만 검색어까지 주소에 넣는다
    const url = SITE_URL + pathname + (pathname === '/search' || pathname === '/estimate' ? search : '')
    document.title = title
    setMeta('meta[name="description"]', 'content', description)
    setMeta('meta[property="og:title"]', 'content', title)
    setMeta('meta[property="og:description"]', 'content', description)
    setMeta('meta[property="og:url"]', 'content', url)
    setMeta('link[rel="canonical"]', 'href', url)
  }, [title, description, pathname, search])
}
