// ../assets/photos/credits.json + cutout/*.png → public/photos/*.webp, src/data/photos.json
// 배경 제거 사진을 앱 크기로 줄여 webp로 바꾸고, 항목 id → 사진 연결표와 출처 정보를 만든다.
// 한 항목에 사진이 여럿이면 브랜드 사진(brand_*)을 먼저 쓴다.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const project = resolve(root, '..');
const outDir = resolve(root, 'public/photos');
const MAX_EDGE = 600; // 카드 사진 최대 표시 폭(약 200px) × 3배 화면
const QUALITY = 80;

const credits = JSON.parse(readFileSync(resolve(project, 'assets/photos/credits.json'), 'utf8'));
mkdirSync(outDir, { recursive: true });
for (const f of readdirSync(outDir)) rmSync(resolve(outDir, f));

const photos = {};
const byItem = {};
let before = 0, after = 0;
for (const c of credits) {
  if (!c.cutout_file) throw new Error(`${c.photo_key}: cutout_file 없음`);
  const input = resolve(project, c.cutout_file);
  const output = resolve(outDir, `${c.photo_key}.webp`);
  const info = await sharp(input)
    .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: QUALITY, alphaQuality: 90 })
    .toFile(output);
  before += readFileSync(input).length;
  after += info.size;

  photos[c.photo_key] = {
    src: `/photos/${c.photo_key}.webp`,
    width: info.width,
    height: info.height,
    name_ko: c.name_ko,
    title: c.title,
    creator: c.creator,
    license: c.license,
    license_url: c.license_url,
    source_page: c.source_page,
    credit: c.credit,
    modified: c.modified,
  };
  for (const id of c.item_ids.split(';').filter(Boolean)) {
    const prev = byItem[id];
    if (!prev || (!prev.startsWith('brand_') && c.photo_key.startsWith('brand_'))) byItem[id] = c.photo_key;
  }
}

mkdirSync(resolve(root, 'src/data'), { recursive: true });
writeFileSync(resolve(root, 'src/data/photos.json'), JSON.stringify({ photos, byItem }, null, 2) + '\n');
const mb = (n) => (n / 1024 / 1024).toFixed(1) + 'MB';
console.log(`사진 ${credits.length}장: ${mb(before)} → ${mb(after)}, 연결된 항목 ${Object.keys(byItem).length}개`);
