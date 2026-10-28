# 음식 제보 저장소 (Supabase) 준비하기

앱의 '신원 등록 신청'(08 제보)은 Supabase에 저장된다. 아래는 처음 한 번만 하면 된다.
(Supabase 화면은 가끔 바뀐다. 메뉴 이름이 조금 달라도 같은 뜻의 메뉴를 찾으면 된다.)

## 1. 가입하고 프로젝트 만들기
1. https://supabase.com 에서 **Start your project** → GitHub 계정이나 이메일로 가입
2. **New project**
   - Organization: 아무 이름 (예: 내 이름), 요금제는 **Free**
   - Project name: `caffeine-id`
   - Database Password: **Generate a password** → 메모장 등 안전한 곳에 저장 (앱에는 안 쓰지만 나중에 필요할 수 있다)
   - Region: **Northeast Asia (Seoul)**
3. **Create new project** → 1~2분 기다리면 준비된다

## 2. 표·권한 만들기 (SQL 한 번 실행)
1. 왼쪽 메뉴 **SQL Editor** → **New query**
2. 이 폴더의 `schema.sql` 내용을 전부 복사해 붙여 넣고 **Run**
3. 아래에 `Success. No rows returned` 가 나오면 끝 (여러 번 실행해도 괜찮다)

만들어지는 것
- `reports` 표: 음식 이름·제조사·분류·사진 여부·접수 시각. 앱은 **넣기만** 가능하고 읽을 수 없다
- `report-photos` 사진 통: 비공개, 2MB 이하 사진만
- 너무 많이 보내기 막기: 같은 접속 주소에서 1시간에 5건, 전체 1분에 30건까지 (주소는 되돌릴 수 없게 바꿔 하루만 보관)

## 3. 주소·공개 키 복사하기
1. 왼쪽 아래 톱니바퀴 **Project Settings** → **API Keys** (또는 **Data API**)
2. 두 가지를 복사한다
   - **Project URL**: `https://○○○○.supabase.co`
   - **공개 키**: `publishable` 키(`sb_publishable_…`) 또는 `anon public` 키(`eyJ…`)
3. ⚠️ `secret` / `service_role` 키는 **절대 앱에 넣지 않는다** (모든 데이터를 읽고 지울 수 있는 열쇠)

## 4. 앱에 넣기
- **개발(내 PC)**: `app` 폴더의 `.env.example`을 복사해 `.env.local`로 이름을 바꾸고 두 값을 채운 뒤 개발 서버를 다시 켠다.
  `.env.local`은 GitHub에 올라가지 않는다.
- **배포(Vercel)**: Vercel 프로젝트 → **Settings → Environment Variables** 에 같은 이름으로 넣고 다시 배포
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

키가 없으면 앱은 제보를 기기에만 보관하고, 키를 넣은 뒤 앱을 다시 열면 자동으로 보낸다.

## 5. 들어온 제보 보기
- **Table Editor → reports**: 제보 목록. 처리하면 `status`를 `done`(등록함)·`rejected`(반려)로 바꿔 두면 편하다
- **Storage → report-photos**: 사진 (파일 이름 = 제보 `id`)

## 알아 둘 것
- 무료 요금제는 **일주일 넘게 쓰이지 않으면 일시정지**된다. 대시보드에서 **Restore**를 누르면 다시 켜진다.
  일시정지 중에 들어온 제보는 각 기기에 보관됐다가, 다시 켜진 뒤 그 기기에서 앱을 열면 보내진다.
