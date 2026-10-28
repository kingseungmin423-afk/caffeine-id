# 피그마 → 코드 파이프라인

피그마 확정본 `2UocI4QnNWt4WWg6w0cVn4`('시안 찐 확정(1026)' 페이지)에서 값을 뽑아 코드로 바꿉니다.
아래 결과 파일은 손으로 고치지 않습니다. 디자인이 바뀌면 다시 뽑아서 덮어씁니다.

| 대상 | 1. 피그마에서 뽑기 | 2. 저장 위치 | 3. 변환 | 결과 |
|---|---|---|---|---|
| 변수·텍스트 스타일·그림자·그라디언트 | Figma MCP `use_figma`로 `scripts/figma/export-tokens.figma.js` 실행 | `design/figma-tokens.json` | `npm run tokens` | `src/styles/tokens.css`, `src/styles/tokens.resolved.json` |
| 컴포넌트 치수 (변수가 없는 고정 크기·선 굵기·점선·회전·위치) | `use_figma`로 `scripts/figma/export-metrics.figma.js` 실행 | `design/figma-metrics.txt` | `npm run tokens` | `tokens.css`의 `--m-*` |
| 화면 치수 (화면 11개 요소의 위치·크기) | `use_figma`로 `scripts/figma/export-screen-metrics.figma.js` 실행 | `design/figma-screen-metrics.txt` | `npm run tokens` | `tokens.css`의 `--m-screen-*` (화면 CSS가 요소 사이 간격을 y 좌표 차이로 계산) |
| 음식 DB | — (`../data/caffeine_db.json`, 카테고리 대응표 `src/data/category-rules.json`) | — | `npm run db` | `src/data/db.json` |
| 아이콘·일러스트·카테고리 아이콘 | `figma-icons.json`의 노드마다 Figma MCP `download_assets`(svg) | `design/figma-svg/<이름의 /를 __로>.svg` | `npm run icons` | `src/assets/{icons,illust,category}/*.svg` |
| 음식 사진 | — (`../assets/photos/credits.json`, `cutout/*.png`) | — | `npm run photos` | `public/photos/*.webp`, `src/data/photos.json` |

컴포넌트 스펙을 사람이 읽기 좋게 보려면 `scripts/figma/dump-spec.figma.js`(NAMES에 세트 이름)를 실행합니다.
화면과 비교: 개발 서버에서 375px로 띄우고 콘솔에서
- `compareLayout()` → 갤러리(`/dev/gallery`)의 컴포넌트 글자 위치를 피그마(`src/dev/figma-layout.json`)와 비교
- `compareScreen('main')` 등 → 지금 화면의 글자 위치를 피그마 화면(`src/dev/figma-screens.json`)과 비교. 데이터가 다른 글자는 '화면에 없음'으로 따로 나온다

## 이름 규칙
- 치수 `--m-<컴포넌트>[-<변형값>]-<노드 경로>-<속성>`: 예) `--m-idcard-stamp-rotate`, `--m-productthumb-s-조회-w`. 변형끼리 값이 같으면 변형값을 뺍니다. 피그마 레이어 이름이 경로가 되므로 Components v2의 레이어 이름을 바꾸면 이름도 바뀝니다
- 텍스트 스타일의 줄 높이는 피그마처럼 정수 px로 반올림합니다 (13px × 150% → 20px)
- 변수 `color/navy/900` → `--color-navy-900`, `bg/canvas` → `--bg-canvas: var(--color-warm-100)`
- `space/16` → `--space-16`, `radius/full` → `--radius-full`, `font/size/13` → `--font-size-13`, `font/weight/bold` → `--font-weight-bold: 700`
- 텍스트 스타일 `Body/13 Regular` → `.t-body-13-regular`, `Display/30 Bold · 125%` → `.t-display-30-bold-125`
- 피그마에 효과 스타일이 없어서 그림자·블러는 'Components v2' 섹션의 컴포넌트에서 모아 '세트 이름 + 변형 값'으로 붙입니다: `--shadow-idcard-확인`(결과 카드), `--shadow-idcard-검사중`(온보딩·로딩·추정 카드), `--shadow-relatedcard`, `--shadow-tabbar-light/dark`, `--blur-tabbar-light/dark`. 이름이 겹치면 `npm run tokens`가 멈춥니다
- 배경 블러는 피그마 값의 절반을 CSS `blur()`에 씁니다 (피그마 Dev Mode와 같은 환산)
- 한 가지 색만 쓰는 아이콘(`icon/*`, `CategoryIcon/*`)은 `currentColor`로 바뀝니다 → 인라인 SVG로 넣고 `color: var(--icon-primary)` 등으로 칠함
