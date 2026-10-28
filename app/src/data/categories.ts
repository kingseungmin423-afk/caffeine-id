// 앱 카테고리 8개 (피그마 CategoryIcon 분류 이름과 같음).
// DB 분류와 대응시키는 표는 화면 작업(3단계)에서 여기에 추가한다.
export const CATEGORIES = ['탄산음료', '에너지음료', '커피', '차', '빙과류', '과자류', '초콜릿', '약'] as const
export type Category = (typeof CATEGORIES)[number]
