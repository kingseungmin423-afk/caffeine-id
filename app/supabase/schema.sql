-- 카페인 신분증: 음식 제보(08 신원 등록 신청) 저장소
-- Supabase 대시보드 → SQL Editor → New query 에 이 파일 전체를 붙여 넣고 Run. 여러 번 실행해도 괜찮다.
--
-- 원칙
-- · 앱(익명 사용자)은 제보를 '넣기'만 할 수 있고 읽기·고치기·지우기는 못 한다. 제보는 대시보드(Table Editor)에서만 본다.
-- · 개인 정보는 받지 않는다. 같은 사람이 너무 많이 보내는 것만 막으려고, 접속 주소(IP)를 날짜와 섞어 되돌릴 수 없게
--   바꾼 값(해시)만 하루 동안 따로 보관하고 지난 것은 지운다. 제보 표에는 아무 식별 정보도 남지 않는다.
-- · 사진은 비공개 통(report-photos)에 2MB 이하 webp·jpeg만, 방금 들어온 제보 번호 이름으로만 올릴 수 있다.

-- 1. 제보 표 ------------------------------------------------------------------
create table if not exists public.reports (
  id uuid primary key,
  name text not null check (char_length(name) between 1 and 60),
  maker text not null default '' check (char_length(maker) <= 60),
  category text not null check (category in ('탄산음료', '에너지음료', '커피', '차', '빙과류', '과자류', '초콜릿', '약', '기타')),
  has_photo boolean not null default false,
  status text not null default 'new' check (status in ('new', 'done', 'rejected')),
  created_at timestamptz not null default now()
);

alter table public.reports enable row level security;

drop policy if exists "익명은 제보 넣기만" on public.reports;
create policy "익명은 제보 넣기만" on public.reports
  for insert to anon
  with check (status = 'new');
-- 읽기·고치기·지우기 정책은 만들지 않는다 = 앱에서는 할 수 없다

-- 2. 너무 많이 보내기 막기 ------------------------------------------------------
create schema if not exists private;
revoke all on schema private from public;

create table if not exists private.report_limits (
  key text not null,
  created_at timestamptz not null default now()
);
create index if not exists report_limits_key_time on private.report_limits (key, created_at);

-- 같은 접속 주소: 1시간에 5건. 전체: 1분에 30건 (봇이 몰려올 때)
create or replace function private.limit_reports() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  ip text := split_part(coalesce(current_setting('request.headers', true)::json ->> 'x-forwarded-for', ''), ',', 1);
  k text := encode(extensions.digest(ip || '|' || to_char(now(), 'YYYY-MM-DD'), 'sha256'), 'hex');
begin
  delete from private.report_limits where created_at < now() - interval '1 day';
  if (select count(*) from private.report_limits where key = k and created_at > now() - interval '1 hour') >= 5 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;
  if (select count(*) from public.reports where created_at > now() - interval '1 minute') >= 30 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;
  insert into private.report_limits (key) values (k);
  return new;
end $$;

drop trigger if exists reports_limit on public.reports;
create trigger reports_limit before insert on public.reports
  for each row execute function private.limit_reports();

-- 3. 사진 통 --------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('report-photos', 'report-photos', false, 2097152, array['image/webp', 'image/jpeg'])
on conflict (id) do update
  set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- 사진 이름 = 하루 안에 들어온 '사진 있음' 제보 번호. 익명은 제보 표를 못 읽으므로 이 확인만 대신 해 주는 함수
create or replace function private.report_accepts_photo(file_name text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.reports r
    where r.id::text = split_part(file_name, '.', 1)
      and r.has_photo
      and r.created_at > now() - interval '1 day'
  )
$$;
grant usage on schema private to anon;
revoke all on function private.report_accepts_photo(text) from public;
grant execute on function private.report_accepts_photo(text) to anon;

drop policy if exists "익명은 제보 사진 올리기만" on storage.objects;
create policy "익명은 제보 사진 올리기만" on storage.objects
  for insert to anon
  with check (
    bucket_id = 'report-photos'
    and name ~ '^[0-9a-f-]{36}\.(webp|jpg)$'
    and private.report_accepts_photo(name)
  );
-- 덮어쓰기·읽기·지우기 정책은 만들지 않는다

-- 4. 많이 찾는 순: 음식별 조회 수 (item-views.sql과 같은 내용) ------------------------
create table if not exists public.item_views (
  item_id text primary key check (item_id ~ '^caf-[0-9]{5}$'),
  views bigint not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.item_views enable row level security;

drop policy if exists "누구나 조회 수 읽기" on public.item_views;
create policy "누구나 조회 수 읽기" on public.item_views
  for select to anon
  using (true);
-- 넣기·고치기·지우기 정책은 만들지 않는다 = 아래 함수로만 늘어난다

create schema if not exists private;
create table if not exists private.view_limits (
  key text not null,
  item_id text not null,
  day date not null default current_date,
  primary key (key, item_id, day)
);

create or replace function public.record_view(p_item_id text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  ip text := split_part(coalesce(current_setting('request.headers', true)::json ->> 'x-forwarded-for', ''), ',', 1);
  k text := encode(extensions.digest(ip || '|' || to_char(now(), 'YYYY-MM-DD'), 'sha256'), 'hex');
  added int;
begin
  if p_item_id is null or p_item_id !~ '^caf-[0-9]{5}$' then
    return;
  end if;
  delete from private.view_limits where day < current_date - 1;
  if (select count(*) from private.view_limits where key = k and day = current_date) >= 300 then
    return;
  end if;
  insert into private.view_limits (key, item_id) values (k, p_item_id) on conflict do nothing;
  get diagnostics added = row_count;
  if added = 0 then
    return; -- 오늘 이미 센 음식
  end if;
  insert into public.item_views (item_id, views) values (p_item_id, 1)
  on conflict (item_id) do update set views = public.item_views.views + 1, updated_at = now();
end $$;

revoke all on function public.record_view(text) from public;
grant execute on function public.record_view(text) to anon;
