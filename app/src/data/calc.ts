// 카페인 계산 (기준값은 config/caffeine.ts의 식약처 자료)
import { COFFEE_REFERENCE, DAILY_LIMIT } from '../config/caffeine'

/** 아메리카노(전문점 커피 국내 평균) 몇 잔인지: '0.26' */
export const coffeeCups = (mg: number) => (mg / COFFEE_REFERENCE.mg).toFixed(2)

/** 아메리카노 1잔 대비 비율 */
export const coffeeRatio = (mg: number) => mg / COFFEE_REFERENCE.mg

/** 하루 권고량 대비 비율 (0~) */
export const dailyRatio = (mg: number) => mg / DAILY_LIMIT.mg
