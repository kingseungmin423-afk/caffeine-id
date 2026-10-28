// 신분증 '발급기관'·출처 문구: DB 신뢰도(confidence)와 브랜드로 만든다.
import type { Item } from './db'

export function issuer(item: Item): string {
  if (item.category === '의약품') return '식약처 의약품안전나라'
  switch (item.confidence) {
    case 'official':
      return item.brand ? `${item.brand} 공식 제품정보` : '식약처 공식 자료'
    case 'package_label':
      return `${item.brand} 제품 포장 표기`
    case 'official_foreign':
      return `${item.brand} 본사 공식 제품정보 (해외 제품 기준)`
    case 'retail_listing':
      return '다나와 상품 정보 (포장 표기)'
    case 'lab_test':
      return '한국소비자원 시험 결과'
    case 'official_average':
      return '식약처 국내 평균'
    case 'estimate_foreign_db':
      return '미국 USDA 식품 DB (추정)'
    case 'ingredient_based':
      return '원재료 기준 (추정)'
  }
}
