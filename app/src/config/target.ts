// 빌드 대상. 'npm run build'(PWA, Vercel)와 'npm run build:toss'(토스 미니앱, vite --mode toss)를 나눈다.
// 빌드할 때 값이 정해지므로, PWA 빌드에서는 토스 전용 코드가 통째로 빠진다(토스 SDK도 들어가지 않는다).
export const IS_TOSS = import.meta.env.MODE === 'toss'
