-- Dart Dog Cup – Supabase schema
-- Paste this whole file into Supabase → SQL Editor → New query → Run.
--
-- Security model:
--   * Everyone with the app link can READ (anon key + RLS select policies).
--   * Nobody can write to the tables directly. All writes go through the
--     SECURITY DEFINER functions below, which check the admin PIN first.
--   * The PIN is stored as a bcrypt hash in `admin_secret`, which has RLS
--     enabled and no policies, so it can't be read through the API.
--
-- The default PIN is 1234. Change it in the app (Settings → Change PIN)
-- or by running:  select change_pin('1234', 'your-new-pin');

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.settings (
  id               int primary key default 1 check (id = 1),
  name             text not null default 'Dart Dog Cup',
  points_per_leg   int  not null default 1,
  match_win_bonus  int  not null default 0,
  legs_to_win      int  not null default 2,
  start_score      int  not null default 501,
  rounds           int  not null default 1,
  updated_at       timestamptz not null default now()
);

create table if not exists public.admin_secret (
  id        int primary key default 1 check (id = 1),
  pin_hash  text not null
);

create table if not exists public.players (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  color       text not null default '#1a92c9',
  created_at  timestamptz not null default now()
);

create table if not exists public.fixtures (
  id         uuid primary key default gen_random_uuid(),
  seq        int  not null default 0,
  round      int  not null,
  home_id    uuid not null references public.players(id) on delete cascade,
  away_id    uuid not null references public.players(id) on delete cascade,
  legs_home  int,
  legs_away  int,
  played_at  timestamptz,
  match_id   uuid
);

create table if not exists public.matches (
  id            uuid primary key,
  created_at    timestamptz not null default now(),
  fixture_id    uuid references public.fixtures(id) on delete set null,
  start_score   int   not null,
  legs_to_win   int   not null,
  sets_to_win   int   not null default 1,
  players       jsonb not null,
  winner_index  int,
  legs_won      jsonb not null default '[]',
  sets_won      jsonb not null default '[]',
  stats         jsonb not null default '[]'
);

create index if not exists fixtures_round_idx on public.fixtures (round, seq);
create index if not exists matches_created_idx on public.matches (created_at desc);

insert into public.settings (id) values (1) on conflict (id) do nothing;
insert into public.admin_secret (id, pin_hash)
values (1, extensions.crypt('1234', extensions.gen_salt('bf')))
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Row level security: public read, no direct writes
-- ---------------------------------------------------------------------------

alter table public.settings     enable row level security;
alter table public.admin_secret enable row level security;
alter table public.players      enable row level security;
alter table public.fixtures     enable row level security;
alter table public.matches      enable row level security;

drop policy if exists "public read" on public.settings;
drop policy if exists "public read" on public.players;
drop policy if exists "public read" on public.fixtures;
drop policy if exists "public read" on public.matches;

create policy "public read" on public.settings for select using (true);
create policy "public read" on public.players  for select using (true);
create policy "public read" on public.fixtures for select using (true);
create policy "public read" on public.matches  for select using (true);

-- ---------------------------------------------------------------------------
-- PIN helpers
-- ---------------------------------------------------------------------------

create or replace function public.verify_pin(p_pin text)
returns boolean
language sql
security definer
set search_path = public, extensions
as $$
  select exists (
    select 1 from admin_secret where id = 1 and pin_hash = crypt(p_pin, pin_hash)
  );
$$;

create or replace function public.assert_pin(p_pin text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if not verify_pin(p_pin) then
    raise exception 'invalid_pin' using errcode = '28P01';
  end if;
end;
$$;

create or replace function public.change_pin(p_pin text, p_new_pin text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  perform assert_pin(p_pin);
  if length(coalesce(p_new_pin, '')) < 4 then
    raise exception 'pin_too_short';
  end if;
  update admin_secret set pin_hash = crypt(p_new_pin, gen_salt('bf')) where id = 1;
end;
$$;

-- ---------------------------------------------------------------------------
-- Write functions (all require the PIN)
-- ---------------------------------------------------------------------------

create or replace function public.save_player(p_pin text, p_player jsonb)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  perform assert_pin(p_pin);
  insert into players (id, name, color, created_at)
  values (
    (p_player->>'id')::uuid,
    p_player->>'name',
    coalesce(p_player->>'color', '#1a92c9'),
    coalesce((p_player->>'created_at')::timestamptz, now())
  )
  on conflict (id) do update set name = excluded.name, color = excluded.color;
end;
$$;

create or replace function public.delete_player(p_pin text, p_id uuid)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  perform assert_pin(p_pin);
  delete from players where id = p_id;
end;
$$;

create or replace function public.save_settings(p_pin text, p_settings jsonb)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  perform assert_pin(p_pin);
  update settings set
    name            = coalesce(p_settings->>'name', name),
    points_per_leg  = coalesce((p_settings->>'points_per_leg')::int, points_per_leg),
    match_win_bonus = coalesce((p_settings->>'match_win_bonus')::int, match_win_bonus),
    legs_to_win     = coalesce((p_settings->>'legs_to_win')::int, legs_to_win),
    start_score     = coalesce((p_settings->>'start_score')::int, start_score),
    rounds          = coalesce((p_settings->>'rounds')::int, rounds),
    updated_at      = now()
  where id = 1;
end;
$$;

create or replace function public.replace_fixtures(p_pin text, p_fixtures jsonb)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  perform assert_pin(p_pin);
  delete from fixtures where true;
  insert into fixtures (id, seq, round, home_id, away_id, legs_home, legs_away, played_at, match_id)
  select
    (f.value->>'id')::uuid,
    f.ordinality::int,
    (f.value->>'round')::int,
    (f.value->>'home_id')::uuid,
    (f.value->>'away_id')::uuid,
    (f.value->>'legs_home')::int,
    (f.value->>'legs_away')::int,
    (f.value->>'played_at')::timestamptz,
    (f.value->>'match_id')::uuid
  from jsonb_array_elements(p_fixtures) with ordinality as f(value, ordinality);
end;
$$;

create or replace function public.set_result(
  p_pin text,
  p_fixture_id uuid,
  p_legs_home int,
  p_legs_away int,
  p_match_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  perform assert_pin(p_pin);
  update fixtures set
    legs_home = p_legs_home,
    legs_away = p_legs_away,
    match_id  = case when p_legs_home is null then null else p_match_id end,
    played_at = case when p_legs_home is null then null else now() end
  where id = p_fixture_id;
end;
$$;

create or replace function public.save_match(p_pin text, p_match jsonb)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  perform assert_pin(p_pin);
  insert into matches (id, created_at, fixture_id, start_score, legs_to_win, sets_to_win, players, winner_index, legs_won, sets_won, stats)
  values (
    (p_match->>'id')::uuid,
    coalesce((p_match->>'created_at')::timestamptz, now()),
    (p_match->>'fixture_id')::uuid,
    (p_match->>'start_score')::int,
    (p_match->>'legs_to_win')::int,
    coalesce((p_match->>'sets_to_win')::int, 1),
    p_match->'players',
    (p_match->>'winner_index')::int,
    coalesce(p_match->'legs_won', '[]'),
    coalesce(p_match->'sets_won', '[]'),
    coalesce(p_match->'stats', '[]')
  )
  on conflict (id) do nothing;
end;
$$;

-- Only the RPCs are callable from the app; assert_pin is internal.
revoke all on function public.assert_pin(text) from public, anon, authenticated;
grant execute on function public.verify_pin(text) to anon, authenticated;
grant execute on function public.change_pin(text, text) to anon, authenticated;
grant execute on function public.save_player(text, jsonb) to anon, authenticated;
grant execute on function public.delete_player(text, uuid) to anon, authenticated;
grant execute on function public.save_settings(text, jsonb) to anon, authenticated;
grant execute on function public.replace_fixtures(text, jsonb) to anon, authenticated;
grant execute on function public.set_result(text, uuid, int, int, uuid) to anon, authenticated;
grant execute on function public.save_match(text, jsonb) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Realtime: push table changes to every open app
-- ---------------------------------------------------------------------------

do $$
declare t text;
begin
  foreach t in array array['settings', 'players', 'fixtures', 'matches'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end;
$$;
