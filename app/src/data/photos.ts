// 음식 사진(배경 제거 webp)과 출처. scripts/build-photos.mjs가 만든 photos.json을 쓴다.
import data from './photos.json'

export type Photo = (typeof data.photos)[keyof typeof data.photos]

// 사진 주소는 '/photos/…'로 저장돼 있다. 빌드 기준 경로(PWA '/', 토스 './')를 붙인다
const photos = Object.fromEntries(
  Object.entries(data.photos as Record<string, Photo>).map(([k, p]) => [k, { ...p, src: import.meta.env.BASE_URL + p.src.replace(/^\//, '') }]),
) as Record<string, Photo>
const byItem = data.byItem as Record<string, string>

export const photoFor = (itemId: string): Photo | null => {
  const key = byItem[itemId]
  return key ? photos[key] : null
}

export const allPhotos = () => Object.values(photos)

// 짧은 덩어리(라이선스·출처 사이트·수정 표시)는 줄 중간에서 갈리지 않게 띄어쓰기를 붙여 둔다 ('Public / domain' 방지)
const SHORT = 20
const glue = (s: string) => (s.length <= SHORT ? s.replace(/ /g, ' ') : s)

/** 출처 한 줄: 'Photo: … / CC BY-SA 4.0 / Wikimedia Commons (배경 제거)' */
export const creditLine = (p: Photo) => {
  const parts = p.credit.split(' / ').map(glue).join(' / ')
  return p.modified ? `${parts} ${glue(`(${p.modified})`)}` : parts
}
