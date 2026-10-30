# 카페인 데이터베이스

'음식 속에 숨어 있는 카페인 찾기' 앱에서 쓰는 카페인 함량 데이터입니다.

## 파일

| 파일 | 설명 |
|---|---|
| `caffeine_db.json` | 앱에서 불러올 통합 데이터 (한국어 항목) |
| `caffeine_db.csv` | 같은 데이터, 엑셀 검토용 |
| `raw/*.csv` | 출처별 원본 수집 결과 |
| `raw/usda_caffeine_all.csv` | USDA 카페인 값 전체 원본 (영어, 100g당 mg). 추정 결과·새 항목 추가용 참고 자료 |
| `scripts/` | 수집·병합 스크립트. 다시 실행하면 최신 값으로 갱신됩니다 |
| `cache/` | USDA 원본 zip (저장소에 올리지 않음) |

## 다시 만들기

```bash
python data/scripts/collect_usda.py
python data/scripts/collect_usda_generic.py
python data/scripts/collect_starbucks.py
python data/scripts/collect_franchise.py
python data/scripts/collect_drugs.py
python data/scripts/collect_kca.py
python data/scripts/collect_mfds_avg.py
python data/scripts/collect_danawa.py build
python data/scripts/fetch_label_images.py   # 사진만 받음. 값은 사람이 읽어 collect_labels.py에 기록
python data/scripts/collect_labels.py
python data/scripts/build_db.py
node data/scripts/collect_soda.mjs          # 일반 탄산음료(카페인 없음). raw/soda_regular.csv를 쓰고 DB 맨 끝에 붙인다
```

## 항목 구조 (`caffeine_db.json` → `items[]`)

| 필드 | 뜻 |
|---|---|
| `id` | 고유 번호 (`caf-00001`) |
| `name_ko` | 음식 이름 |
| `aliases` | 검색용 동의어 (`;`로 구분) |
| `brand` | 브랜드·제조사 (일반 식품은 빈칸) |
| `category` / `subcategory` | 분류 |
| `serving` | 기준량 (예: `355ml (Tall)`, `1정(589.3 밀리그램) 중`) |
| `caffeine_mg` | 기준량당 카페인(mg) |
| `has_caffeine` | 카페인 있음 여부 (`caffeine_mg > 0`) |
| `confidence` | 신뢰도 (아래 표) |
| `source` / `source_url` / `checked_at` | 출처, 확인 링크, 수집일 |
| `image_key` | 쓸 일러스트 이름. 그림은 `assets/food/{image_key}.svg` (종류별 36장, `scripts/make_food_icons.py`로 생성) |
| `needs_review` / `notes` | 사람이 확인해야 하는 항목과 이유 |

## 신뢰도 등급

| 값 | 뜻 | 앱 표시 제안 |
|---|---|---|
| `official` | 제조사·프랜차이즈·식약처 공식 표기 | 정식 결과 |
| `package_label` | 제조사 공식 사이트 제품 사진·제품정보에서 읽은 포장 표기 | 정식 결과 |
| `official_foreign` | 제조사 본사(미국) 공식 제품정보. 콜라처럼 국내 포장에 표시 의무가 없는 제품 | 정식 결과, '해외 제품 기준' 표시 |
| `retail_listing` | 다나와 상품 사양(판매처가 등록한 포장 표기) | 정식 결과, 출처 표시 |
| `lab_test` | 한국소비자원 시험 결과 | 정식 결과 (조사 연도 표시) |
| `official_average` | 식약처가 발표한 유형별 국내 평균 (특정 제품 아님) | 정식 결과, '국내 평균' 표시 |
| `estimate_foreign_db` | 미국 USDA 값을 한국 음식명에 연결한 추정치 | '추정' 표시 (A안 임시 신분증 / B안 가채점) |
| `ingredient_based` | 원재료에 카페인이 없어서 0mg으로 본 값 (보리차 등) | '추정' 표시 |

## 출처

- **스타벅스 코리아** 공식 메뉴 영양정보 — 톨(355ml) 기준
- **이디야커피, 메가MGC커피, 빽다방, 할리스, 커피빈, 공차** 공식 홈페이지 메뉴 영양정보
- **서울우유, 빙그레** 공식 사이트 제품 사진의 포장 표기, **매일유업** 공식 제품 가이드 (`fetch_label_images.py`로 사진을 받고, 읽은 값은 `collect_labels.py`에 기록)
- **코카-콜라, 펩시코** 본사 공식 제품정보 (미국 제품 기준)
- **다나와** 상품 사양의 카페인 함량 (에너지음료)
- **식약처 의약품안전나라** — 카페인 성분이 든 허가 의약품의 원료약품 및 분량 (허가 취소·취하 제외)
- **식약처 정보그림 뉴스**(2021) — 녹차·콜라·커피우유·커피믹스·에너지음료·커피음료·전문점 커피의 국내 평균
- **한국소비자원 비교공감** 시험 결과 — 프랜차이즈 차음료(2026), 디카페인 캡슐커피(2025), 제로음료(2024), 밀크초콜릿(2023), 즉석커피(2022), 에너지음료(2016)
- **USDA FoodData Central** — SR Legacy(2018), Foundation(2026), FNDDS(2021–2023)

## 대표 음식 사진 (`assets/photos/`)

자주 보이는 음식 36종과 브랜드 제품 13종, 모두 49장만 실제 사진을 쓰고 나머지는 `image_key` 일러스트를 씁니다.

- 출처: 위키미디어 공용(Wikimedia Commons). 상업적 사용이 되는 CC0, 퍼블릭 도메인, CC BY, CC BY-SA 사진만 골랐습니다.
- 일반 음식 사진은 같은 종류의 여러 항목에 연결했습니다 (`credits.csv`의 `item_ids`).
- 브랜드 제품 사진(`brand_*`)은 제조사 공식 사진이 아니라 사용자가 직접 찍어 CC로 올린 사진입니다. 한 항목이 일반 사진과 브랜드 사진에 모두 연결되면 **브랜드 사진을 우선**합니다. 로고와 포장은 '이 제품이 무엇인지' 보여주는 용도로만 쓰고, 제조사가 앱을 후원·보증하는 것처럼 보이게 쓰지 않습니다.
- 포장 글자는 한국어나 영어인 사진만 씁니다. 펩시 제로슈가 라임은 필리핀판 병(영어 포장)이라 국내 캔과 모양이 다릅니다. 레드불은 나라마다 캔 아래에 현지어 문구를 넣어서, 지금 사진에도 작은 이탈리아어 문구가 있습니다(제품명은 영어). 박카스 사진은 박카스F라 F에만 연결했습니다.
- 사람(손·얼굴·몸·행인)이 찍힌 사진은 쓰지 않습니다. 초상권 문제를 피하기 위해서입니다.
- 저작권 점검: `python data/scripts/review_photos.py` → `assets/photos/license_review.csv`. 사진마다 위키미디어 원본 페이지를 다시 조회해 라이선스가 바뀌었는지, 삭제 요청·침해 신고가 있는지, Flickr에서 옮긴 사진이면 라이선스 확인을 통과했는지, 초상권·상표 경고가 있는지 확인합니다. 출시 직전에 한 번 더 돌리세요.
- 핫식스, 서울우유 커피, 아카페라, 맥심, 칸타타는 공용에 사진이 없습니다. 조지아와 가나는 일본판 사진뿐이라 넣지 않았습니다. 이 제품들은 직접 찍어서 넣어야 합니다.
- **CC BY, CC BY-SA 사진은 앱 안에 `credit` 문구(작가 · 라이선스 · 출처)를 반드시 표시**해야 합니다. 정보 화면에 사진 출처 목록을 두면 됩니다.
- CC BY-SA 사진을 잘라내거나 색을 바꾸는 등 수정해서 쓰면, 수정한 사진도 같은 CC BY-SA로 공개해야 합니다.
- 캔커피, 커피믹스, 우유는 쓸 만한 사진이 없어 일러스트로 둡니다.
- 앱에는 배경을 지운 `assets/photos/cutout/{photo_key}.png`(투명 배경, 1000×1000)를 씁니다. `python data/scripts/cutout_photos.py`로 만들고(BiRefNet 모델), 손·숟가락·다른 컵이 같이 찍힌 사진은 `CROP`으로 먼저 잘라냅니다. 무엇을 고쳤는지는 `credits.csv`의 `modified` 칸에 적힙니다.
- 오려내기가 깔끔하도록 흰 배경 스튜디오 사진을 먼저 찾아 썼습니다 (`search --white`, `PICKS`의 `'w3'` 형식). 아메리카노·카푸치노·티라미수·화이트초콜릿·펩시가 이 사진입니다.
- 배경 제거와 자르기는 원본을 수정한 것입니다. CC BY 사진은 출처에 "수정함"을 함께 적고, CC BY-SA 사진은 수정한 사진도 같은 CC BY-SA로 공개해야 합니다 (출처 화면에 라이선스를 그대로 적어 두면 됩니다).
- 린트 린도볼(진열대 더미 사진뿐)과 마운틴듀(풀이 캔을 가린 사진뿐)는 깔끔하게 오려낼 수 없어 넣지 않았습니다.
- 다시 찾기: `python data/scripts/collect_photos.py search` (흰 배경만: `search --white`) → 모음 이미지(`data/cache/photos/sheets`)를 보고 `PICKS` 수정 → `python data/scripts/collect_photos.py pick` → `python data/scripts/cutout_photos.py`

## 알려진 한계

- 공공데이터포털의 식품영양성분DB(전국통합식품영양성분정보)에는 **카페인 항목이 없습니다.** 국내 가공식품(과자, 아이스크림, 빵)은 공식 수치가 거의 없어서 USDA 추정치로 채웠습니다.
- 에너지음료 시험 결과(2016)와 즉석커피(2022)는 오래된 자료라 제품 리뉴얼로 값이 달라졌을 수 있습니다.
- 같은 제품이 출처마다 다른 값으로 들어 있을 수 있습니다 (예: 스타벅스 공식 톨 기준 vs 소비자원 시험 1잔 기준). 앱에서는 공식 값을 우선 보여주는 것을 권장합니다.
- 투썸플레이스, 컴포즈커피, 폴바셋은 홈페이지에서 수집할 수 없어 소비자원 시험 결과만 들어 있습니다.
- 보리차·옥수수차·현미차는 차 자체의 측정값이 아니라 원재료(곡물)의 카페인 0mg을 근거로 넣었습니다(`ingredient_based`). 둥굴레차는 근거 자료가 없어 넣지 않았습니다.
- **콜라는 국내 포장에 카페인이 표시되지 않습니다.** 1ml당 0.15mg 미만이라 표시 의무 대상이 아니기 때문입니다. 그래서 콜라는 미국 본사 공식값과 식약처 국내 평균만 있습니다.
- **분말 커피믹스·아이스크림(더위사냥 등)·과자**는 액체가 아니라 표시 의무가 없어 포장에도 카페인이 없습니다. 식약처 평균·USDA 추정으로만 채울 수 있습니다.
- 동서식품·롯데칠성·남양·투썸·컴포즈·폴바셋은 사이트 구조상 수집하지 못했습니다.
- 빙그레 아카페라 사이즈업·심플리·오늘의 커피·스페셜티, 서울우유 커피타운·포리커피(컵)는 공식 사진 앞면에 카페인이 안 보이거나 글자가 작아 읽지 못해 넣지 않았습니다.
- 커피빈 66건, 이디야 22건, 빽다방 6건은 홈페이지에 기준 용량이 없어 `serving`이 비어 있습니다.
- `aliases`는 띄어쓰기 없는 이름, 브랜드 줄임말(스벅·메가커피 등), 아아/뜨아를 자동으로 붙인 것입니다.
- `needs_review`가 `true`인 항목은 출처 표기 자체가 이상해 보이는 값입니다. 앱에 넣기 전에 확인해 주세요.
