// 카페인 계산 기준. 반드시 식약처 자료를 따른다. 값을 바꿀 때는 출처도 함께 고친다.
// (2026-10-27 출처 확인)

/** 커피 환산 기준: 전문점 커피 1잔(250ml) 국내 평균 카페인. DB caf-00304 */
export const COFFEE_REFERENCE = {
  mg: 132,
  label: '아메리카노',
  source: '식약처 정보그림 뉴스 「식품통계로 알아보는 음료류 이야기」 (2021-01-21)',
  url: 'https://www.mfds.go.kr/brd/m_629/view.do?seq=28',
} as const

/** 하루 권고량: 성인 최대 일일섭취권고량 400mg 이하 (임산부 300mg, 어린이·청소년 체중 1kg당 2.5mg) */
export const DAILY_LIMIT = {
  mg: 400,
  source: '식약처 보도자료 「우리나라 카페인 섭취 안전한 수준 - 카페인 섭취량 평가 결과」',
  url: 'https://www.korea.kr/briefing/pressReleaseView.do?newsId=156061464',
} as const
