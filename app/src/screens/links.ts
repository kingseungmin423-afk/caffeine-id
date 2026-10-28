// 화면 주소
import type { Category } from '../data/categories'

export const paths = {
  welcome: '/welcome',
  main: '/',
  category: '/category',
  categoryDetail: (c: Category) => `/category/${encodeURIComponent(c)}`,
  search: (q = '') => (q ? `/search?q=${encodeURIComponent(q)}` : '/search'),
  item: (id: string) => `/item/${id}`,
  estimate: (q: string) => `/estimate?q=${encodeURIComponent(q)}`,
  /** 04 로딩을 거쳐 결과로 */
  check: (to: string) => `/check?to=${encodeURIComponent(to)}`,
  report: (name = '') => (name ? `/report?name=${encodeURIComponent(name)}` : '/report'),
  info: '/info',
}

/** 로딩 화면이 넘겨줄 수 있는 주소만 허용 */
export const isCheckTarget = (to: string) => /^\/(item\/caf-\d+|estimate\?q=)/.test(to)
