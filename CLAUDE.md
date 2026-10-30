# 카페인 신분증 PWA — 작업 인수인계

'음식 속에 숨어 있는 카페인 찾기' 포트폴리오 과제. 먹기 전에 음식의 카페인을 신분증 형식으로 조회하는 PWA.
현재 상태(2026-10-28): **개발 순서 1~6 완료, 7의 피그마 비교 완료** (토큰·아이콘·이미지, 공통 컴포넌트, 화면 9개, 인터랙션, PWA, 제보 전송). 배포 완료(2026-10-28): GitHub `kingseungmin423-afk/caffeine-id`(공개, main 올리면 Vercel 자동 배포), Vercel 프로젝트 `caffeine-id`(Root Directory `app`, 환경 변수 2개) → **https://www.caffeineid.com** (2026-10-31 가비아 도메인 연결: A `@` 216.198.79.1, CNAME `www` → Vercel, `caffeineid.com`은 www로 308 이동. 예전 주소 https://caffeine-id-eosin.vercel.app 도 열림). 남은 것: 실제 폰에서 설치·오프라인 확인. 피그마 비교는 개발 서버 콘솔 `compareScreen(키)` (애니메이션 끝난 뒤, 375px). 의도한 차이: 한글 낱말 단위 줄바꿈(피그마는 글자 단위라 09 정보 줄 수가 다름), 05 사진 출처 줄(관련 음식이 아래로), 4칸 탭바, 커피 환산 실제 계산값.
- PWA: `app/vite.config.ts`(vite-plugin-pwa 1.3.0, manifest 색은 토큰, 처음 방문 때 앱·DB·사진·글꼴 전부 캐시, 새 버전은 받자마자 교체(autoUpdate)되고 다음 실행·새로고침 때 화면에 적용. prompt 방식은 아이폰 홈 화면 앱에서 업데이트가 계속 미뤄져서 바꿈), `app/vercel.json`(주소 새로고침 → index.html). 아이콘은 `npm run app-icons` → `public/icons/*` (원본 `design/logo/app-icon.svg`). 설치 팝업 자리 `screens/InstallPrompt.tsx` + `store/install.ts`(02 메인에서, 디자인 받기 전 임시). 배포본 확인은 `npm run build` 후 미리보기 `app-preview`(4173).
- **토스 미니앱(앱인토스)도 함께 출시 예정 (2026-10-30 시작). PWA에 문제가 생기면 안 된다** → 같은 코드에서 빌드만 나눈다.
  - `npm run build`(PWA·Vercel)는 그대로. `npm run build:toss` = `vite build --mode toss`(→ `dist-toss`, 상대 경로, 서비스 워커·manifest 없음, 확대 금지) + `ait build`(→ `app/<appName>.ait`, 콘솔에 올리는 파일). 확인은 미리보기 `app-toss-preview`(4175).
  - 토스 전용 분기는 `config/target.ts`의 `IS_TOSS`(빌드 때 정해져 PWA 번들에는 토스 코드·SDK가 안 들어감). 토스 SDK 호출은 `toss/bridge.ts`를 `if (IS_TOSS) import(...)`로만.
  - 토스에서 다른 점: 주소가 `#/item/…`(HashRouter), 설치 팝업·PC 틀 없음, 토스 내비게이션 바 색을 화면 배경에 맞춤(`TabDock.tsx` → `NavigationBar.setOptions`), 사진 출처는 링크 없이 글자(토스 밖 이동 금지).
  - 설정 `app/apps-in-toss.config.ts`: SDK `@apps-in-toss/web-framework` 3.8.0, `appName`은 콘솔 등록 이름과 같아야 함(지금 임시 `caffeine-id`), 자체 뒤로가기가 있어 토스 뒤로가기·홈 버튼 끔.
  - 출시 체크리스트(비게임): 토스 내비게이션 바 사용, 자체·토스 뒤로가기 동시 노출 금지, 첫 화면에서 뒤로가기 = 종료, 라이트 모드, 확대 금지, 토스 밖 이동·앱 설치 유도·자체 로그인 금지, HTTPS만, SSR 금지. 아직 샌드박스(실제 토스 환경)에서 확인 못 함: 위쪽 여백, 사진 올리기(input file), 안드로이드 뒤로가기, 제보 전송.
- 검색 노출(PWA만, 2026-10-31): 구글 Search Console은 가비아 DNS TXT로 소유 확인, 네이버 서치어드바이저는 HTML 태그(`vite.config.ts`의 `seo()`가 index.html에 넣음). 빌드가 `robots.txt`·`sitemap.xml`(홈·분류·정보 + 음식 1,603개)·`og-image.png` 생성. 화면마다 탭 제목·설명·대표 주소는 `screens/pageMeta.ts`(문구 `copy.seo`), 대표 주소 `config/site.ts`.
- PC 화면(사용자 요청, 피그마에 없음): 마우스 쓰는 넓은 화면이면 양옆 회색(`--color-gray-200`), 앱은 가운데 375 폭을 화면 높이에 맞춰 키움(최대 1.2배). `screens/desktopFrame.ts` + `styles/base.css`. 상단 바 색(theme-color)은 화면 테마를 따라감(`TabDock.tsx`).
- 인터랙션: 움직임 값은 `app/src/styles/motion.css`(피그마 프로토타입 값 + '추가' 표시), `app/src/config/motion.ts`. 탭바는 앱에 하나(`screens/TabDock.tsx`)라 화면이 바뀌어도 선택 표시가 튕기며 옮겨 간다. 가로 줄 끌기·카드 단위 멈춤은 `components/useDragScroll.ts` + `styles/drag-scroll.css`.
- 탭바는 사용자 요청으로 4칸(홈·조회·제보·정보), 떠 있는 뒤로가기 없음 (피그마 Components v2 `TabBar`, 이전 2칸은 `TabBar 2칸 (이전)`). 파이프라인은 `app/design/README.md`, 컴포넌트 목록은 `app/design/components.md`, 비교용 갤러리는 개발 서버 `/dev/gallery`.
- 코드 위치: 화면 `app/src/screens/*`, 데이터 `app/src/data/*`(DB·카테고리 대응표·검색·사진), 계산 기준 `app/src/config/caffeine.ts`(식약처 132mg·400mg + 출처), 기기 저장 `app/src/store/*`, 문구 `app/src/copy.ts`.
- 제보(08) 6단계 코드 완료: `store/reports.ts`(IndexedDB 보관함 → Supabase REST로 글 넣고 사진 올림, 오프라인·실패면 보관했다가 연결/앱 시작 때 자동 전송, 사진은 긴 변 1280으로 다시 저장해 EXIF 제거, 기기 하루 5건, 숨은 칸·2.5초 미만 제출은 봇으로 버림), 기준값 `config/report.ts`, 서버 `app/supabase/schema.sql`(익명 insert만, IP 해시로 1시간 5건·전체 1분 30건, 비공개 사진 통 2MB), 준비 안내 `app/supabase/README.md`. 키는 `app/.env.local`(`.env.example` 참고)·Vercel 환경 변수. 2026-10-28 실제 프로젝트(`ypkzddafxcxumgamozsa`) 연결·전송 확인 완료 (익명 읽기·덮어쓰기·모르는 번호 사진 모두 막힘). 배포 때 Vercel 환경 변수에도 같은 두 값 필요.
- 02-2 정렬(2026-10-31 사용자 요청): '가나다순' 글자를 누를 때마다 가나다순 ↔ 많이 찾는 순. 많이 찾는 순 = 전체 사용자 조회 수(Supabase `item_views` + `record_view` 함수, `app/supabase/item-views.sql`, 익명 숫자만·같은 접속 주소는 음식마다 하루 1번). 앱 `store/views.ts`(결과 화면에서 보냄, 분류 상세에서 받아 옴), 연결 공통 `store/supabase.ts`. 서버에 연결 안 되면 가나다순으로 대신.
- 사진 없는 음식의 대체 일러스트는 만들지 않기로 함(사용자 결정, 2026-10-28) → 사진 없으면 기존 '?' 카드. 출시 전 사진 출처 재검사는 Node판 `node data/scripts/review_photos.mjs`(review_photos.py와 같은 점검 + 앱 표기 대조)로 2026-10-30 실행: 49장 모두 문제 없음 → `assets/photos/license_review.csv`.

## 절대 규칙
- **피그마 디자인 규칙(색, 간격, 모서리, 글꼴, 레이아웃)을 변경·수정하지 않는다.** 화면은 피그마 그대로 구현한다.
- 코드에 색 코드·px 값을 직접 쓰지 않고 피그마에서 자동 생성한 토큰만 쓴다.
- 디자인은 언제든 바뀔 수 있다 → 토큰은 스크립트로 다시 뽑고, 컴포넌트 이름은 피그마 컴포넌트 이름과 1:1로 맞추고, 문구는 파일 하나에 모은다.
- 디자인에 없는 상태(검색 결과 없음, 오프라인, 항목이 적은 카테고리 등)는 기존 컴포넌트·토큰만 조합해서 만든다. 새 스타일 금지.
- GitHub 업로드·Vercel 배포는 사용자 허락을 받고 진행한다.

## 피그마
- **확정본:** `2UocI4QnNWt4WWg6w0cVn4` (포트폴리오 디자인 PWA 확정본), 페이지 '시안 찐 확정(1026)'
  - 화면: 01 온보딩, 02 메인(확장), 02-1 카테고리, 02-2 카테고리 상세(탄산음료), 03 검색, 04 로딩(신분증 검사), 05 결과 앞면, 06 결과 뒷면, flip 05→06·06→05 각 3프레임, 07 추정 결과(임시 출입증), 08 음식 제보(신원 등록 신청), 09 정보(발급 규정)
  - **컴포넌트: 섹션 'Components v2'(`19:2108`)만 기준.** 화면에서 다시 뽑아 만든 25종 + 아이콘·일러스트. 목록은 `app/design/components.md`. 예전 'Components' 프레임은 쓰지 않음(오래됨)
  - 프로토타입: 카테고리·더보기 → 02-2 (Smart Animate 0.25s), 카드 클릭 → flip(0.16s → 0.2s Smart Animate) → 반대면, 뒤로가기 버튼
  - 변수 컬렉션: **Atomic**(색 107개, 계열별 100~900 + 기존 중간 단계, 투명도 색 `alpha/*`), **Semantic**(색 50개, Atomic 참조: `bg/*`, `text/*`, `border/*`, `icon/*`, `accent/gold`, `status/*`), **Layout**(`space/0~48`, `radius/2~30`, `radius/full`), **Typography**(`font/family`=Pretendard, `font/size/*`, `font/weight/*`)
  - 텍스트 스타일 40개: `Display/31 ExtraBold`, `Body/13 Regular` 형식. 줄 간격 150%, 자간 -2% (일부 `· 125%`, `· Auto` 변형)
  - 밝은 화면 배경 `bg/canvas`(#F4F2EF), 어두운 화면 배경 `bg/inverse`(#1F2A44)
  - 앱 기준 폭 375px. 상태바·홈 인디케이터는 구현하지 않는다.
- 예전 와이어프레임 파일: `dqSkRlzGjxi2ecpUy1hHLV` (A/B 시안, 일러스트 페이지) — 참고용

## 기술 결정
- **React + Vite + TypeScript + vite-plugin-pwa(Workbox)**, 앱 폴더는 프로젝트 안 `app/`
- PWA 필수 요소: manifest(플러그인 생성, 테마 색은 토큰), HTTPS(Vercel 자동), service worker(앱·DB·이미지 오프라인 캐시)
- 토큰 파이프라인: 피그마 변수·텍스트 스타일 → `tokens.css` 자동 생성 (Atomic `--color-navy-900`, Semantic `--bg-canvas: var(--color-warm-100)`, `--space-*`, `--radius-*`, `.t-body-13-regular` 등)
- 아이콘은 피그마 컴포넌트에서 SVG로 내보낸다. Pretendard는 앱에 포함(오프라인).
- 업데이트: 새 버전은 다음 실행 때 자동 적용(업데이트 안내 UI 없음)

## 화면·주소
| 화면 | 주소 | 비고 |
|---|---|---|
| 01 온보딩 | `/welcome` | 처음 방문자만 |
| 02 메인 | `/` | 최근 조회(기기 저장), TOP 5·비교 퀴즈(미리 고른 목록) |
| 02-1 / 02-2 | `/category`, `/category/:분류` | 조회한 음식=사진 카드, 안 본 음식=미발급 카드(정보 제4조) |
| 03 검색 | `/search?q=` | 띄어쓰기 무시, 별칭(아아·스벅 등) 포함 |
| 04 로딩 | 결과로 가는 중간 | 3단계 체크 연출 |
| 05·06 결과 | `/item/:id` | 카드 탭하면 앞 카드가 위쪽 축으로 들려 넘어가고(3D는 이 카드만, 아이폰 WebKit 대응) 뒤 카드 뒤로 내려앉음, 뒤 카드가 앞으로(피그마 flip 대신 사용자 요청, `Result/CardDeck.tsx`) |
| 07 추정 | `/estimate?q=` | DB에 없으면 비슷한 음식 값으로 범위 표시 |
| 08 제보 | `/report` | Supabase로 전송 |
| 09 정보 | `/info` | 발급 규정 + 사진 출처 목록 |

- 카테고리 8개(탄산음료, 에너지음료, 커피, 차, 빙과류, 과자류, 초콜릿, 약)에 DB 분류를 대응시키는 표를 만든다.

## 데이터·계산 규칙
- DB: `data/caffeine_db.json` (1,603개). 설명은 `data/README.md`
- **계산은 반드시 조사한 식약처 자료 기준.** 커피 환산 = 카페인 ÷ **132mg**(식약처 전문점 커피 국내 평균, DB `caf-00304`), 하루 권고량 = 성인 **400mg**(식약처). 피그마의 '0.23잔'은 예시 값일 뿐. 개발 시 식약처 원문을 다시 확인하고 출처와 함께 설정 파일 한 곳에 둔다.
- 이미지: `assets/photos/cutout/*.png`(배경 제거 사진 49장, `credits.csv`의 `item_ids`로 항목 연결, 브랜드 사진 우선) → 없으면 `assets/food/{image_key}.svg` 일러스트
- **사진 출처 표시 필수**(CC BY·BY-SA 31장): 09 정보 화면 맨 아래 '사진 출처' 목록 + 06 카드 뒷면 출처 칸 아래 한 줄. `credits.csv`의 `credit`, `modified`(배경 제거 = 수정함) 사용. 출시 전 `python data/scripts/review_photos.py`로 재검사.

## 음식 제보 (Supabase)
- 앱에서 바로 Supabase로 저장(구글폼 사용 안 함). 사진은 Supabase Storage.
- RLS: 익명은 insert만, 조회 불가. 키는 Vercel 환경 변수에.
- 사진 크기 제한 + 위치 정보(EXIF) 제거, 개인 정보 수집 안 함, 스팸 방지(횟수 제한·봇 차단), 오프라인이면 기기에 저장 후 연결 시 전송.
- 무료 요금제는 한동안 사용이 없으면 일시정지됨 → 사용자에게 안내 완료. 계정·키 발급은 사용자가 직접(단계별 안내 필요).

## 설치 안내 팝업
- 안드로이드·PC 크롬/엣지/삼성 인터넷: 자체 팝업의 [설치] 버튼 → `beforeinstallprompt`로 설치창 (사용자 클릭 필요)
- 아이폰 사파리: 설치창 불가 → '공유 → 홈 화면에 추가' 안내 팝업
- 인앱 브라우저(카카오톡·인스타·네이버): '크롬/사파리로 열기' 안내
- 조건: 온보딩 완료 또는 첫 검색 후, 닫으면 7일간 안 띄움, 설치된 앱(standalone)에서는 안 띄움

## 사용자가 나중에 줄 것
- 설치 팝업 디자인, 아이폰 안내 그림. **앱 아이콘·로고는 확정(2026-10-30): 피그마 `AppIcon/A2 신분증 (확정)`(`77:1728`)** → SVG로 내보낸 `app/design/logo/app-icon.svg`를 `npm run app-icons`가 `public/icons/*`(PWA·토스 빌드 공통)와 `design/logo/toss-logo-600.png`(앱인토스 콘솔 앱 로고·다크모드 로고 600×600)로 만든다. 로고를 바꾸면 SVG만 다시 내보내고 스크립트를 다시 돌린다.
- Supabase 프로젝트 생성·키

## 개발 순서
1. 토큰 → CSS 자동 변환, 아이콘·이미지 정리
2. 공통 컴포넌트(신분증 카드, 리스트 행, 탭바, 떠 있는 뒤로가기, 버튼, 칩)
3. 화면 9개
4. 카드 뒤집기·로딩 연출·화면 전환
5. PWA 설정(manifest, service worker, 설치 팝업 자리)
6. Supabase 제보
7. 375px로 띄워 피그마와 화면별 비교
