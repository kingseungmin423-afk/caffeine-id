# 컴포넌트 목록 (피그마 'Components v2')

피그마 확정본 `2UocI4QnNWt4WWg6w0cVn4`, 페이지 '시안 찐 확정(1026)'의 섹션 **Components v2**(`19:2108`).
2026-10-27에 화면 11개(01~09)의 현재 모습을 복사해서 만들었다. 화면 자체는 바꾸지 않았다(작업 전후 렌더링 동일).
예전 `Components` 프레임의 컴포넌트는 화면에서 크기·색이 많이 덮어써져 있어 쓰지 않는다.
코드 컴포넌트 이름과 변형(prop) 이름은 아래 표와 1:1로 맞춘다.
코드: `src/components/<이름>/` (index.tsx + <이름>.module.css). prop 이름은 피그마 속성 이름 그대로(첫 글자 소문자, 한글은 그대로: `상태`, `정보`).
예외: Button의 `Style`은 React `style`과 겹쳐서 `variant`. 고정 문구는 `src/copy.ts`.
2026-10-27 코드 작업 때 레이어 이름을 역할 이름으로 정리했다(예: RankRow의 '1'→`rank`, Lanyard 글자→`label`). 치수 토큰 이름이 레이어 이름을 따른다.

| 컴포넌트 | 변형 | 가져온 화면 |
|---|---|---|
| `Badge` | Type=있음 | 03 |
| `ProductThumb` | Size=S(36)·M(43)·L(56) × 상태=조회 / M 미조회 | 02, 03, 07 |
| `Chip` | Selected=On·Off | 03, 08 |
| `Button` | Style=White·Navy | 01·07, 08 |
| `Lanyard` | Theme=Dark·Light·Visitor, Length=Long / Dark Short | 05·06·07 / 01·04 |
| `CategoryThumb` | Size=L(56)·M(44) | 02, 02-1 |
| `SearchField` | State=Empty·Filled | 02, 03 |
| `TextField` | State=Filled·Empty (라벨 포함) | 08 |
| `SectionHeader` | Theme=Light·Dark | 02, 05 |
| `BackHeader` | Theme=Light·Dark | 08, 05 |
| `DailyRatio` | Type=확정·추정 (비율 + 막대 + 출처) | 05, 07 |
| `PhotoUpload` | — | 08 |
| `FoodRow` | 상태=조회·미조회 | 02, 03 |
| `RankRow` | Highlight=On(1위)·Off | 02 |
| `EvidenceRow` | — | 07 |
| `CategoryItem` | — | 02 |
| `CategoryCard` | — | 02-1 |
| `QuizOption` | — | 02 |
| `LoadingStep` | 상태=완료·진행중·대기 | 04 |
| `Article` | — | 09 |
| `IDCard` | State=확인·검사중·추정 | 05, 01·04, 07 |
| `IDCardBack` | 정보=표시·숨김 | 06, 01 |
| `IDCardMini` | 상태=발급·미발급 | 02-2 |
| `RelatedCard` | 상태=조회·미조회 | 05·06 |
| `TabBar` | Theme=Light·Dark × Active=홈·조회·제보·정보 (4칸, 떠 있는 뒤로가기 없음). 2026-10-27 사용자 요청으로 추가, 아이콘 `icon/home`·`icon/report` 새로 그림 | — |
| `TabBar 2칸 (이전)` | 이전 디자인(조회·정보 + 떠 있는 뒤로가기). 화면 프레임이 아직 이 인스턴스를 씀. 앱에서는 안 씀 | 02, 09, 03, 05 |

그대로 쓰는 기존 컴포넌트(같은 섹션 맨 윗줄로 옮김): `icon/*` 6개(+ 새로 그린 `icon/home`·`icon/report`), `illust/*` 5개, `CategoryIcon`(8분류), `HomeIndicator`(앱에서는 구현하지 않음).

화면에서 한 번만 쓰여 컴포넌트로 만들지 않은 것: 02 TOP5 카드 틀·퀴즈 카드 틀, 04 스캔 프레임·스캔 빛, 각 화면 제목 문단. 화면 코드에서 토큰으로 직접 만든다.
