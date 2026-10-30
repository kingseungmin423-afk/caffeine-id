-- 카페인 신분증: '많이 찾는 순' 정렬용 음식별 조회 수 (2026-10-31 추가, schema.sql 4번과 같은 내용)
-- Supabase 대시보드 → SQL Editor → New query 에 붙여 넣고 Run. 여러 번 실행해도 괜찮다.
--
-- 원칙
-- · 저장하는 건 '음식 번호별 조회 수' 숫자뿐. 누가 봤는지는 남기지 않는다.
-- · 앱(익명)은 숫자를 읽을 수 있고, 늘리는 건 record_view 함수로만 (직접 고치기·지우기 불가).
-- · 부풀리기 막기: 같은 접속 주소(되돌릴 수 없게 바꾼 값, 하루만 보관)는 음식마다 하루 1번, 하루 전체 300번까지만 센다.

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
