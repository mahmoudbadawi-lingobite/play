-- =====================================================================
-- MONSTER QUEST  -  Phase 1 migration
-- Run once in the Supabase SQL editor (same project as LingoBite Play).
-- Safe to re-run: tables use IF NOT EXISTS, functions use OR REPLACE,
-- seed rows use ON CONFLICT.
--
-- Security model: students have NO direct write access to any mq_ table
-- and cannot read mq_questions (which holds the answers). Everything that
-- awards XP, coins, captures or items happens inside the SECURITY DEFINER
-- functions below, which validate answers and roll the dice on the server.
-- =====================================================================

-- ---------------------------------------------------------------- config
create table if not exists public.mq_config (
  key text primary key,
  value numeric not null,
  note text
);

create or replace function public.mq_cfg(p_key text, p_def numeric)
returns numeric language sql stable security definer set search_path = public as $$
  select coalesce((select value from public.mq_config where key = p_key), p_def);
$$;

-- ---------------------------------------------------------- definitions
create table if not exists public.mq_zones (
  id text primary key,
  name text not null,
  description text,
  unlock_level int not null default 1,
  min_level int not null default 2,
  max_level int not null default 6,
  difficulty int not null default 1 check (difficulty between 1 and 5),
  palette jsonb not null,
  sort int not null default 0,
  active boolean not null default true
);

create table if not exists public.mq_species (
  id text primary key,
  name text not null,
  type text not null check (type in ('fire','water','grass','electric','earth','ice','air','shadow','light','crystal')),
  rarity text not null check (rarity in ('common','uncommon','rare','epic','legendary')),
  description text,
  base_hp int not null default 40,
  base_attack int not null default 10,
  base_defense int not null default 10,
  base_speed int not null default 10,
  zones text[] not null default '{}',
  spawn_weight int not null default 10,
  capture_difficulty int not null default 1 check (capture_difficulty between 1 and 5),
  required_correct int not null default 1 check (required_correct between 1 and 5),
  art jsonb not null,            -- parametric artwork spec (see MonsterArt.tsx)
  sprite_url text,               -- optional PNG/WebP that overrides the drawn art
  active boolean not null default true
);

create table if not exists public.mq_items (
  key text primary key,
  name text not null,
  kind text not null check (kind in ('ball')),
  description text,
  price_coins int,
  price_gems int,
  catch_multiplier numeric not null default 1,
  color text not null default '#3b82f6',
  sort int not null default 0,
  active boolean not null default true
);

-- --------------------------------------------------------- question bank
create table if not exists public.mq_questions (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('mcq','true_false','fill_blank','spelling','type_answer','listening','reading','sentence_order','word_match')),
  subject text not null default 'English',
  topic text,
  grade int,                      -- null = any grade
  difficulty int not null default 1 check (difficulty between 1 and 5),
  prompt text not null,
  passage text,                   -- reading comprehension text
  image_url text,
  audio_url text,
  tts_text text,                  -- spoken by the browser when there is no audio_url
  options jsonb,                  -- mcq/listening/reading: ["a","b",..]; sentence_order: words; word_match: {"left":[..]}
  answer jsonb not null,          -- mcq: "text"; typed: ["accepted",...]; order: [words]; match: {"left":"right"}
  explanation text,
  xp_reward int not null default 5 check (xp_reward between 0 and 50),
  time_limit_s int,               -- null = no timer
  active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists mq_questions_pick_idx on public.mq_questions (active, difficulty);

-- --------------------------------------------------------- player state
create table if not exists public.mq_players (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  coins int not null default 0 check (coins >= 0),
  gems int not null default 0 check (gems >= 0),
  correct_total int not null default 0,
  wrong_total int not null default 0,
  last_encounter_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.mq_inventory (
  user_id uuid not null references public.profiles(id) on delete cascade,
  item_key text not null references public.mq_items(key),
  qty int not null default 0 check (qty >= 0),
  primary key (user_id, item_key)
);

create table if not exists public.mq_player_monsters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  species_id text not null references public.mq_species(id),
  level int not null default 1,
  xp int not null default 0,
  hp int not null, attack int not null, defense int not null, speed int not null,
  nickname text,
  favorite boolean not null default false,
  team_slot int check (team_slot between 1 and 6),
  zone_id text,
  ball_key text,
  captured_at timestamptz not null default now()
);
create index if not exists mq_pm_user_idx on public.mq_player_monsters (user_id);
create unique index if not exists mq_pm_team_slot_uq on public.mq_player_monsters (user_id, team_slot) where team_slot is not null;

create table if not exists public.mq_encounters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  zone_id text not null,
  species_id text not null references public.mq_species(id),
  level int not null,
  required_correct int not null,
  correct_count int not null default 0,
  wrong_count int not null default 0,
  streak int not null default 0,
  meter int not null default 0,
  throws int not null default 0,
  status text not null default 'active' check (status in ('active','captured','escaped','fled')),
  current_question_id uuid,
  current_started_at timestamptz,
  asked uuid[] not null default '{}',
  xp_earned int not null default 0,
  coins_earned int not null default 0,
  created_at timestamptz not null default now(),
  ended_at timestamptz
);
create index if not exists mq_enc_user_idx on public.mq_encounters (user_id, created_at desc);

create table if not exists public.mq_answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  encounter_id uuid references public.mq_encounters(id) on delete set null,
  question_id uuid references public.mq_questions(id) on delete set null,
  correct boolean not null,
  xp_awarded int not null default 0,
  response_ms int,
  answered_at timestamptz not null default now()
);
create index if not exists mq_answers_user_idx on public.mq_answers (user_id, answered_at desc);
create index if not exists mq_answers_q_idx on public.mq_answers (question_id);

create table if not exists public.mq_capture_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  encounter_id uuid references public.mq_encounters(id) on delete set null,
  species_id text not null,
  ball_key text not null,
  chance numeric not null,
  success boolean not null,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------------ RLS
alter table public.mq_config enable row level security;
alter table public.mq_zones enable row level security;
alter table public.mq_species enable row level security;
alter table public.mq_items enable row level security;
alter table public.mq_questions enable row level security;
alter table public.mq_players enable row level security;
alter table public.mq_inventory enable row level security;
alter table public.mq_player_monsters enable row level security;
alter table public.mq_encounters enable row level security;
alter table public.mq_answers enable row level security;
alter table public.mq_capture_attempts enable row level security;

drop policy if exists "mq_zones: read" on public.mq_zones;
create policy "mq_zones: read" on public.mq_zones for select using (auth.uid() is not null);
drop policy if exists "mq_species: read" on public.mq_species;
create policy "mq_species: read" on public.mq_species for select using (auth.uid() is not null);
drop policy if exists "mq_items: read" on public.mq_items;
create policy "mq_items: read" on public.mq_items for select using (auth.uid() is not null);
drop policy if exists "mq_config: admin reads" on public.mq_config;
create policy "mq_config: admin reads" on public.mq_config for select using (public.is_admin());

-- definitions are edited by admins only (zones/species/items/config)
drop policy if exists "mq_zones: admin writes" on public.mq_zones;
create policy "mq_zones: admin writes" on public.mq_zones for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "mq_species: admin writes" on public.mq_species;
create policy "mq_species: admin writes" on public.mq_species for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "mq_items: admin writes" on public.mq_items;
create policy "mq_items: admin writes" on public.mq_items for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "mq_config: admin writes" on public.mq_config;
create policy "mq_config: admin writes" on public.mq_config for all using (public.is_admin()) with check (public.is_admin());

-- questions: students get NO policy (they receive questions through mq_next_question)
drop policy if exists "mq_questions: staff read own or all (admin)" on public.mq_questions;
create policy "mq_questions: staff read own or all (admin)" on public.mq_questions for select
  using (public.is_admin() or created_by = auth.uid());
drop policy if exists "mq_questions: staff insert" on public.mq_questions;
create policy "mq_questions: staff insert" on public.mq_questions for insert
  with check ((public.is_teacher() or public.is_admin()) and (created_by = auth.uid() or created_by is null and public.is_admin()));
drop policy if exists "mq_questions: owner or admin update" on public.mq_questions;
create policy "mq_questions: owner or admin update" on public.mq_questions for update
  using (public.is_admin() or created_by = auth.uid()) with check (public.is_admin() or created_by = auth.uid());
drop policy if exists "mq_questions: owner or admin delete" on public.mq_questions;
create policy "mq_questions: owner or admin delete" on public.mq_questions for delete
  using (public.is_admin() or created_by = auth.uid());

-- player data: read-only for the owner; teachers can read their students' progress
drop policy if exists "mq_players: own or staff read" on public.mq_players;
create policy "mq_players: own or staff read" on public.mq_players for select using (
  user_id = auth.uid() or public.is_admin()
  or exists (select 1 from public.class_students cs join public.classes c on c.id = cs.class_id
             where cs.student_id = mq_players.user_id and c.teacher_id = auth.uid()));
drop policy if exists "mq_inventory: own read" on public.mq_inventory;
create policy "mq_inventory: own read" on public.mq_inventory for select using (user_id = auth.uid());
drop policy if exists "mq_pm: own or staff read" on public.mq_player_monsters;
create policy "mq_pm: own or staff read" on public.mq_player_monsters for select using (
  user_id = auth.uid() or public.is_admin()
  or exists (select 1 from public.class_students cs join public.classes c on c.id = cs.class_id
             where cs.student_id = mq_player_monsters.user_id and c.teacher_id = auth.uid()));
drop policy if exists "mq_encounters: own read" on public.mq_encounters;
create policy "mq_encounters: own read" on public.mq_encounters for select using (user_id = auth.uid());
drop policy if exists "mq_answers: own or staff read" on public.mq_answers;
create policy "mq_answers: own or staff read" on public.mq_answers for select using (
  user_id = auth.uid() or public.is_admin()
  or exists (select 1 from public.class_students cs join public.classes c on c.id = cs.class_id
             where cs.student_id = mq_answers.user_id and c.teacher_id = auth.uid()));
drop policy if exists "mq_attempts: own read" on public.mq_capture_attempts;
create policy "mq_attempts: own read" on public.mq_capture_attempts for select using (user_id = auth.uid());

grant select on public.mq_zones, public.mq_species, public.mq_items to authenticated;
grant select, insert, update, delete on public.mq_zones, public.mq_species, public.mq_items, public.mq_config, public.mq_questions to authenticated;
grant select on public.mq_players, public.mq_inventory, public.mq_player_monsters, public.mq_encounters, public.mq_answers, public.mq_capture_attempts to authenticated;

-- ------------------------------------------------------------- helpers
create or replace function public.mq_level(p_xp int)
returns int language sql immutable as $$
  select floor(sqrt(greatest(p_xp, 0) / 40.0))::int + 1;
$$;

create or replace function public.mq_norm(t text)
returns text language sql immutable as $$
  select regexp_replace(regexp_replace(lower(btrim(coalesce(t, ''))), '\s+', ' ', 'g'), '[.!?,;:]+$', '');
$$;

create or replace function public.mq_check(q public.mq_questions, a jsonb)
returns boolean language plpgsql immutable as $$
declare
  mine text; theirs text;
begin
  if a is null then return false; end if;
  if q.type in ('mcq','listening','reading','true_false') then
    return public.mq_norm(a #>> '{}') = public.mq_norm(q.answer #>> '{}');
  elsif q.type in ('fill_blank','spelling','type_answer') then
    return exists (select 1 from jsonb_array_elements_text(q.answer) x where public.mq_norm(x) = public.mq_norm(a #>> '{}'));
  elsif q.type = 'sentence_order' then
    if jsonb_typeof(a) <> 'array' then return false; end if;
    select string_agg(public.mq_norm(v), '|' order by ord) into mine from jsonb_array_elements_text(a) with ordinality t(v, ord);
    select string_agg(public.mq_norm(v), '|' order by ord) into theirs from jsonb_array_elements_text(q.answer) with ordinality t(v, ord);
    return mine = theirs;
  elsif q.type = 'word_match' then
    if jsonb_typeof(a) <> 'object' then return false; end if;
    return a = q.answer;
  end if;
  return false;
end;
$$;

-- what the student is allowed to see of a question (never the answer)
create or replace function public.mq_public_question(q public.mq_questions)
returns jsonb language plpgsql stable as $$
declare opts jsonb;
begin
  if q.type in ('mcq','listening','reading') then
    select coalesce(jsonb_agg(x order by random()), '[]'::jsonb) into opts from jsonb_array_elements(q.options) x;
  elsif q.type = 'true_false' then
    opts := '["True","False"]'::jsonb;
  elsif q.type = 'sentence_order' then
    select coalesce(jsonb_agg(x order by random()), '[]'::jsonb) into opts from jsonb_array_elements(coalesce(q.options, q.answer)) x;
  elsif q.type = 'word_match' then
    select jsonb_build_object(
      'left', q.options -> 'left',
      'right', (select coalesce(jsonb_agg(v order by random()), '[]'::jsonb) from jsonb_each_text(q.answer) e(k, v))
    ) into opts;
  end if;
  return jsonb_build_object(
    'id', q.id, 'type', q.type, 'prompt', q.prompt, 'passage', q.passage, 'image_url', q.image_url,
    'audio_url', q.audio_url, 'tts_text', case when q.type in ('spelling','listening') then q.tts_text end,
    'options', opts, 'difficulty', q.difficulty, 'time_limit_s', q.time_limit_s, 'topic', q.topic, 'subject', q.subject);
end;
$$;

create or replace function public.mq_xp_today(p_user uuid)
returns int language sql stable security definer set search_path = public as $$
  select coalesce(sum(xp_awarded), 0)::int from public.mq_answers
  where user_id = p_user and answered_at >= date_trunc('day', now());
$$;

-- ------------------------------------------------------- game functions
create or replace function public.mq_state()
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  p public.mq_players;
  xp int;
begin
  if uid is null then raise exception 'not signed in'; end if;
  select * into p from public.mq_players where user_id = uid;
  if p.user_id is null then
    insert into public.mq_players (user_id, coins, gems)
    values (uid, mq_cfg('starter_coins', 100)::int, mq_cfg('starter_gems', 0)::int) returning * into p;
    insert into public.mq_inventory (user_id, item_key, qty) values (uid, 'quest_orb', mq_cfg('starter_orbs', 8)::int)
    on conflict (user_id, item_key) do nothing;
  end if;
  select total_xp into xp from public.profiles where id = uid;
  return jsonb_build_object(
    'coins', p.coins, 'gems', p.gems, 'xp', coalesce(xp, 0), 'level', mq_level(coalesce(xp, 0)),
    'correct_total', p.correct_total, 'wrong_total', p.wrong_total,
    'xp_today', mq_xp_today(uid), 'xp_daily_cap', mq_cfg('daily_xp_cap', 400)::int,
    'inventory', coalesce((select jsonb_object_agg(item_key, qty) from public.mq_inventory where user_id = uid), '{}'::jsonb));
end;
$$;

create or replace function public.mq_start_encounter(p_zone text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  z public.mq_zones; p public.mq_players; s public.mq_species;
  xp int; total int; roll int; acc int := 0; lvl int; e public.mq_encounters;
begin
  if uid is null then raise exception 'not signed in'; end if;
  select * into p from public.mq_players where user_id = uid;
  if p.user_id is null then raise exception 'open Monster Quest first'; end if;
  select * into z from public.mq_zones where id = p_zone and active;
  if z.id is null then raise exception 'unknown zone'; end if;
  select total_xp into xp from public.profiles where id = uid;
  if mq_level(coalesce(xp, 0)) < z.unlock_level then raise exception 'this zone unlocks at level %', z.unlock_level; end if;
  if p.last_encounter_at is not null and now() - p.last_encounter_at < interval '1500 milliseconds' then
    raise exception 'slow down, explorer';
  end if;

  update public.mq_encounters set status = 'fled', ended_at = now() where user_id = uid and status = 'active';
  update public.mq_players set last_encounter_at = now() where user_id = uid;

  select coalesce(sum(spawn_weight), 0) into total from public.mq_species where active and p_zone = any(zones);
  if total = 0 then raise exception 'no monsters live here yet'; end if;
  roll := floor(random() * total)::int;
  for s in select * from public.mq_species where active and p_zone = any(zones) order by id loop
    acc := acc + s.spawn_weight;
    if roll < acc then exit; end if;
  end loop;

  lvl := z.min_level + floor(random() * (z.max_level - z.min_level + 1))::int;
  insert into public.mq_encounters (user_id, zone_id, species_id, level, required_correct)
  values (uid, z.id, s.id, lvl, s.required_correct) returning * into e;

  return jsonb_build_object('id', e.id, 'zone_id', z.id, 'species_id', s.id, 'level', lvl,
    'required_correct', e.required_correct, 'meter', 0, 'status', 'active');
end;
$$;

create or replace function public.mq_next_question(p_encounter uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  e public.mq_encounters; s public.mq_species; z public.mq_zones; q public.mq_questions;
  d int; lo int; hi int;
begin
  select * into e from public.mq_encounters where id = p_encounter and user_id = uid;
  if e.id is null or e.status <> 'active' then raise exception 'this encounter is over'; end if;
  select * into s from public.mq_species where id = e.species_id;
  select * into z from public.mq_zones where id = e.zone_id;
  d := least(5, greatest(1, round((s.capture_difficulty + z.difficulty) / 2.0)::int));
  lo := greatest(1, d - 1); hi := least(5, d + 1);

  select * into q from public.mq_questions
   where active and difficulty between lo and hi and not (id = any(e.asked))
   order by random() limit 1;
  if q.id is null then
    select * into q from public.mq_questions where active and difficulty between lo and hi order by random() limit 1;
  end if;
  if q.id is null then
    select * into q from public.mq_questions where active order by random() limit 1;
  end if;
  if q.id is null then raise exception 'the question bank is empty'; end if;

  update public.mq_encounters
     set current_question_id = q.id, current_started_at = now(),
         asked = (array_append(asked, q.id))[greatest(1, cardinality(asked) - 18):]
   where id = e.id;
  return mq_public_question(q);
end;
$$;

create or replace function public.mq_answer(p_encounter uuid, p_answer jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  e public.mq_encounters; q public.mq_questions;
  ok boolean; late boolean := false; ms int;
  gain_meter int; xp_gain int := 0; coin_gain int := 0; cap int; used int; new_streak int;
  fled boolean := false; max_wrong int := mq_cfg('max_wrong', 3)::int;
begin
  select * into e from public.mq_encounters where id = p_encounter and user_id = uid for update;
  if e.id is null or e.status <> 'active' then raise exception 'this encounter is over'; end if;
  if e.current_question_id is null then raise exception 'no question is waiting'; end if;
  select * into q from public.mq_questions where id = e.current_question_id;
  ms := (extract(epoch from (now() - e.current_started_at)) * 1000)::int;
  if q.time_limit_s is not null and ms > (q.time_limit_s + 6) * 1000 then late := true; end if;
  ok := (not late) and mq_check(q, p_answer);

  if ok then
    new_streak := e.streak + 1;
    gain_meter := mq_cfg('meter_per_correct', 25)::int + least(new_streak - 1, 4) * mq_cfg('meter_streak_bonus', 5)::int;
    cap := mq_cfg('daily_xp_cap', 400)::int; used := mq_xp_today(uid);
    xp_gain := greatest(0, least(q.xp_reward + least(new_streak - 1, 3), cap - used));
    coin_gain := mq_cfg('coins_per_correct', 4)::int;
    update public.mq_encounters set correct_count = correct_count + 1, streak = new_streak,
      meter = least(100, meter + gain_meter), xp_earned = xp_earned + xp_gain, coins_earned = coins_earned + coin_gain,
      current_question_id = null where id = e.id returning * into e;
    update public.mq_players set coins = coins + coin_gain, correct_total = correct_total + 1 where user_id = uid;
    if xp_gain > 0 then update public.profiles set total_xp = total_xp + xp_gain where id = uid; end if;
  else
    update public.mq_encounters set wrong_count = wrong_count + 1, streak = 0,
      meter = greatest(0, meter - mq_cfg('meter_loss_wrong', 10)::int), current_question_id = null
      where id = e.id returning * into e;
    update public.mq_players set wrong_total = wrong_total + 1 where user_id = uid;
    if e.wrong_count >= max_wrong then
      fled := true;
      update public.mq_encounters set status = 'escaped', ended_at = now() where id = e.id;
    end if;
  end if;

  insert into public.mq_answers (user_id, encounter_id, question_id, correct, xp_awarded, response_ms)
  values (uid, e.id, q.id, ok, xp_gain, ms);

  if fled then
    insert into public.game_results (game_key, student_id, student_name, xp_earned, accuracy, duration_seconds, content_set_title)
    select 'monster-quest', uid, display_name, e.xp_earned, round(100.0 * e.correct_count / greatest(1, e.correct_count + e.wrong_count))::int,
           (extract(epoch from (now() - e.created_at)))::int, 'Monster Quest' from public.profiles where id = uid;
  end if;

  return jsonb_build_object(
    'correct', ok, 'late', late, 'explanation', q.explanation, 'correct_answer', q.answer,
    'xp', xp_gain, 'coins', coin_gain, 'meter', e.meter, 'streak', e.streak,
    'correct_count', e.correct_count, 'wrong_count', e.wrong_count, 'required_correct', e.required_correct,
    'can_throw', (not fled) and e.correct_count >= e.required_correct, 'escaped', fled);
end;
$$;

create or replace function public.mq_throw_ball(p_encounter uuid, p_ball text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  e public.mq_encounters; s public.mq_species; it public.mq_items; z public.mq_zones;
  have int; base numeric; chance numeric; hit boolean; esc boolean := false;
  cap_xp int; cap_coins int; new_id uuid; lvl int; mon public.mq_player_monsters;
begin
  select * into e from public.mq_encounters where id = p_encounter and user_id = uid for update;
  if e.id is null or e.status <> 'active' then raise exception 'this encounter is over'; end if;
  if e.correct_count < e.required_correct then raise exception 'answer more questions first'; end if;
  if e.current_question_id is not null then raise exception 'finish the current question first'; end if;
  select * into it from public.mq_items where key = p_ball and kind = 'ball' and active;
  if it.key is null then raise exception 'unknown ball'; end if;
  select qty into have from public.mq_inventory where user_id = uid and item_key = it.key for update;
  if coalesce(have, 0) < 1 then raise exception 'you are out of % balls', it.name; end if;
  select * into s from public.mq_species where id = e.species_id;

  update public.mq_inventory set qty = qty - 1 where user_id = uid and item_key = it.key;
  base := mq_cfg('catch_base_' || s.rarity, case s.rarity when 'common' then 0.75 when 'uncommon' then 0.6 when 'rare' then 0.45 when 'epic' then 0.3 else 0.18 end);
  chance := least(0.95, base * it.catch_multiplier * (0.6 + e.meter / 250.0));
  hit := random() < chance;
  insert into public.mq_capture_attempts (user_id, encounter_id, species_id, ball_key, chance, success)
  values (uid, e.id, s.id, it.key, chance, hit);

  if hit then
    lvl := e.level;
    insert into public.mq_player_monsters (user_id, species_id, level, hp, attack, defense, speed, zone_id, ball_key)
    values (uid, s.id, lvl,
      s.base_hp + lvl * 4 + floor(random() * 6)::int,
      s.base_attack + lvl * 2 + floor(random() * 4)::int,
      s.base_defense + lvl * 2 + floor(random() * 4)::int,
      s.base_speed + lvl * 2 + floor(random() * 4)::int,
      e.zone_id, it.key) returning * into mon;
    cap_xp := case s.rarity when 'common' then 15 when 'uncommon' then 25 when 'rare' then 45 when 'epic' then 80 else 150 end;
    cap_xp := greatest(0, least(cap_xp, mq_cfg('daily_xp_cap', 400)::int + 100 - mq_xp_today(uid)));
    cap_coins := case s.rarity when 'common' then 10 when 'uncommon' then 20 when 'rare' then 40 when 'epic' then 80 else 200 end;
    update public.mq_encounters set status = 'captured', ended_at = now(), throws = throws + 1,
      xp_earned = xp_earned + cap_xp, coins_earned = coins_earned + cap_coins where id = e.id returning * into e;
    update public.mq_players set coins = coins + cap_coins where user_id = uid;
    update public.profiles set total_xp = total_xp + cap_xp where id = uid;
    insert into public.game_results (game_key, student_id, student_name, xp_earned, accuracy, duration_seconds, content_set_title)
    select 'monster-quest', uid, display_name, e.xp_earned, round(100.0 * e.correct_count / greatest(1, e.correct_count + e.wrong_count))::int,
           (extract(epoch from (now() - e.created_at)))::int, 'Monster Quest' from public.profiles where id = uid;
    return jsonb_build_object('success', true, 'chance', chance, 'monster_id', mon.id, 'xp', cap_xp, 'coins', cap_coins,
      'level_after', mq_level((select total_xp from public.profiles where id = uid)));
  end if;

  esc := random() < mq_cfg('escape_after_miss', 0.25);
  update public.mq_encounters set throws = throws + 1, meter = greatest(0, meter - 20),
    status = case when esc then 'escaped' else 'active' end, ended_at = case when esc then now() end
    where id = e.id returning * into e;
  if esc then
    insert into public.game_results (game_key, student_id, student_name, xp_earned, accuracy, duration_seconds, content_set_title)
    select 'monster-quest', uid, display_name, e.xp_earned, round(100.0 * e.correct_count / greatest(1, e.correct_count + e.wrong_count))::int,
           (extract(epoch from (now() - e.created_at)))::int, 'Monster Quest' from public.profiles where id = uid;
  end if;
  return jsonb_build_object('success', false, 'chance', chance, 'escaped', esc, 'meter', e.meter);
end;
$$;

create or replace function public.mq_flee(p_encounter uuid)
returns void language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); e public.mq_encounters;
begin
  update public.mq_encounters set status = 'fled', ended_at = now(), current_question_id = null
   where id = p_encounter and user_id = uid and status = 'active' returning * into e;
  if e.id is not null and (e.correct_count + e.wrong_count) > 0 then
    insert into public.game_results (game_key, student_id, student_name, xp_earned, accuracy, duration_seconds, content_set_title)
    select 'monster-quest', uid, display_name, e.xp_earned, round(100.0 * e.correct_count / greatest(1, e.correct_count + e.wrong_count))::int,
           (extract(epoch from (now() - e.created_at)))::int, 'Monster Quest' from public.profiles where id = uid;
  end if;
end;
$$;

create or replace function public.mq_buy(p_item text, p_qty int)
returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); it public.mq_items; p public.mq_players; c int; g int;
begin
  if p_qty < 1 or p_qty > 20 then raise exception 'choose between 1 and 20'; end if;
  select * into it from public.mq_items where key = p_item and active;
  if it.key is null then raise exception 'item not for sale'; end if;
  select * into p from public.mq_players where user_id = uid for update;
  if p.user_id is null then raise exception 'open Monster Quest first'; end if;
  c := coalesce(it.price_coins, 0) * p_qty; g := coalesce(it.price_gems, 0) * p_qty;
  if it.price_coins is null and it.price_gems is null then raise exception 'item not for sale'; end if;
  if p.coins < c then raise exception 'not enough coins'; end if;
  if p.gems < g then raise exception 'not enough gems'; end if;
  update public.mq_players set coins = coins - c, gems = gems - g where user_id = uid;
  insert into public.mq_inventory (user_id, item_key, qty) values (uid, it.key, p_qty)
  on conflict (user_id, item_key) do update set qty = public.mq_inventory.qty + p_qty;
  return mq_state();
end;
$$;

create or replace function public.mq_set_team(p_ids uuid[])
returns void language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); n int; i int;
begin
  if coalesce(cardinality(p_ids), 0) > 6 then raise exception 'a team holds up to 6 monsters'; end if;
  select count(*) into n from public.mq_player_monsters where user_id = uid and id = any(coalesce(p_ids, '{}'));
  if n <> coalesce(cardinality(p_ids), 0) then raise exception 'those monsters are not yours'; end if;
  update public.mq_player_monsters set team_slot = null where user_id = uid;
  for i in 1 .. coalesce(cardinality(p_ids), 0) loop
    update public.mq_player_monsters set team_slot = i where id = p_ids[i] and user_id = uid;
  end loop;
end;
$$;

create or replace function public.mq_toggle_favorite(p_id uuid)
returns void language sql security definer set search_path = public as $$
  update public.mq_player_monsters set favorite = not favorite where id = p_id and user_id = auth.uid();
$$;

create or replace function public.mq_leaderboard(p_kind text)
returns table (rank int, user_id uuid, display_name text, value bigint, level int)
language sql stable security definer set search_path = public as $$
  with stats as (
    select p.id, p.display_name, p.total_xp,
           (select count(*) from public.mq_player_monsters m where m.user_id = p.id) as monsters,
           (select count(*) from public.mq_player_monsters m where m.user_id = p.id and m.captured_at > now() - interval '7 days') as weekly
    from public.profiles p join public.mq_players mp on mp.user_id = p.id)
  select (row_number() over (order by v desc, display_name))::int, id, display_name, v::bigint, mq_level(total_xp)
  from (select *, case p_kind when 'monsters' then monsters when 'weekly' then weekly else total_xp end as v from stats) t
  where v > 0 order by v desc, display_name limit 25;
$$;

-- per-question accuracy for the question-bank manager (only rows the caller may manage)
create or replace function public.mq_question_stats()
returns table (question_id uuid, asked bigint, correct bigint)
language sql stable security definer set search_path = public as $$
  select a.question_id, count(*), count(*) filter (where a.correct)
  from public.mq_answers a join public.mq_questions q on q.id = a.question_id
  where public.is_admin() or q.created_by = auth.uid()
  group by a.question_id;
$$;

-- ------------------------------------------------------------- seed data
insert into public.mq_config (key, value, note) values
  ('starter_coins', 100, 'coins a new trainer starts with'),
  ('starter_gems', 0, 'gems a new trainer starts with'),
  ('starter_orbs', 8, 'Quest Orbs a new trainer starts with'),
  ('coins_per_correct', 4, 'coins for each correct answer'),
  ('daily_xp_cap', 400, 'max Monster Quest XP from answers per day'),
  ('meter_per_correct', 25, 'capture meter gained per correct answer'),
  ('meter_streak_bonus', 5, 'extra meter per consecutive correct answer (max 4 steps)'),
  ('meter_loss_wrong', 10, 'capture meter lost per wrong answer'),
  ('max_wrong', 3, 'wrong answers before the monster runs away'),
  ('escape_after_miss', 0.25, 'chance the monster flees after a missed throw'),
  ('catch_base_common', 0.75, null), ('catch_base_uncommon', 0.6, null), ('catch_base_rare', 0.45, null),
  ('catch_base_epic', 0.3, null), ('catch_base_legendary', 0.18, null)
on conflict (key) do nothing;

insert into public.mq_items (key, name, kind, description, price_coins, price_gems, catch_multiplier, color, sort) values
  ('quest_orb', 'Quest Orb', 'ball', 'A standard capture orb.', 25, null, 1, '#3b82f6', 1),
  ('great_orb', 'Great Orb', 'ball', '1.5x better than a Quest Orb.', 60, null, 1.5, '#06b6d4', 2),
  ('ultra_orb', 'Ultra Orb', 'ball', 'Twice as effective. For rare finds.', 140, null, 2, '#f59e0b', 3),
  ('prism_orb', 'Prism Orb', 'ball', 'Triple strength, bought with gems.', null, 5, 3, '#d946ef', 4)
on conflict (key) do nothing;

insert into public.mq_zones (id, name, description, unlock_level, min_level, max_level, difficulty, palette, sort) values
  ('forest', 'Green Forest', 'Rustling grass, friendly creatures. A gentle place to start.', 1, 2, 6, 1,
   '{"grass":["#6fcf6a","#5bbf5a"],"path":["#e3c98f","#d7b878"],"tall":"#2f9e44","tree":"#2b8a3e","trunk":"#8d5a2b","rock":"#9aa5b1","water":"#4dabf7","sky":["#bfe9ff","#e9fbe5"]}'::jsonb, 1),
  ('desert', 'Sunbaked Desert', 'Hot dunes, cacti and quick-footed monsters.', 2, 5, 10, 2,
   '{"grass":["#f2d58a","#ecc872"],"path":["#e8b86d","#dca85a"],"tall":"#c99a3b","tree":"#5fa14e","trunk":"#a86f32","rock":"#c07f4a","water":"#38bdf8","sky":["#ffe3a3","#fff3d1"]}'::jsonb, 2),
  ('snow', 'Frostpeak Tundra', 'Icy fields where crystal creatures glimmer.', 4, 8, 14, 3,
   '{"grass":["#eaf6ff","#dcedf9"],"path":["#b9d7ee","#a9cbe6"],"tall":"#7fb5da","tree":"#2f7f6f","trunk":"#6b4a2b","rock":"#8fa3b8","water":"#74c0fc","sky":["#d4ecff","#f5fbff"]}'::jsonb, 3)
on conflict (id) do nothing;

insert into public.mq_species (id, name, type, rarity, description, base_hp, base_attack, base_defense, base_speed, zones, spawn_weight, capture_difficulty, required_correct, art) values
 ('sproutle','Sproutle','grass','common','A cheerful sprout that photosynthesises while it naps.',42,9,10,8,'{forest}',30,1,1,'{"body":"round","c1":"#7bd66a","c2":"#3f9d4a","belly":"#e8f8c8","ears":"round","tail":"leaf","eyes":"cute","mark":"spots","extra":"none"}'),
 ('pebblin','Pebblin','earth','common','Collects shiny pebbles and hides them in its fur.',48,10,14,5,'{forest}',28,1,1,'{"body":"wide","c1":"#b08968","c2":"#7f5539","belly":"#e6ccb2","ears":"round","tail":"none","eyes":"sleepy","mark":"spots","extra":"none"}'),
 ('puffwing','Puffwing','air','common','So fluffy it drifts away in a strong breeze.',38,8,8,14,'{forest}',26,1,1,'{"body":"round","c1":"#9bd1ff","c2":"#5aa9ee","belly":"#ffffff","ears":"none","tail":"none","eyes":"cute","mark":"none","extra":"wings"}'),
 ('splashet','Splashet','water','uncommon','Leaves little puddles wherever it hops.',44,10,11,11,'{forest}',16,2,1,'{"body":"bean","c1":"#4dabf7","c2":"#1c7ed6","belly":"#d0ebff","ears":"none","tail":"fin","eyes":"cute","mark":"none","extra":"crest"}'),
 ('emberkit','Emberkit','fire','uncommon','A warm little fox whose tail never quite goes out.',40,13,9,13,'{forest,desert}',14,2,2,'{"body":"tall","c1":"#ff922b","c2":"#e8590c","belly":"#ffe8cc","ears":"pointy","tail":"flame","eyes":"fierce","mark":"none","extra":"none"}'),
 ('zapling','Zapling','electric','uncommon','Crackles with static when it is excited.',39,12,9,16,'{forest,desert}',12,2,2,'{"body":"bean","c1":"#38d9a9","c2":"#12b886","belly":"#fff3bf","ears":"pointy","tail":"bolt","eyes":"fierce","mark":"stripes","extra":"none"}'),
 ('mosswyrm','Mosswyrm','grass','rare','An ancient, mossy guardian of the deep forest.',60,14,16,7,'{forest}',5,3,2,'{"body":"wide","c1":"#51cf66","c2":"#2b8a3e","belly":"#d8f5a2","ears":"horn","tail":"leaf","eyes":"sleepy","mark":"gem","extra":"crest"}'),
 ('dunepup','Dunepup','earth','common','Digs tunnels in the sand just for fun.',46,11,12,9,'{desert}',28,2,1,'{"body":"round","c1":"#f4a261","c2":"#c97b3a","belly":"#fde8cf","ears":"pointy","tail":"curl","eyes":"cute","mark":"cheeks","extra":"none"}'),
 ('cactling','Cactling','grass','common','Prickly outside, soft-hearted inside.',44,9,15,6,'{desert}',24,2,1,'{"body":"tall","c1":"#69db7c","c2":"#2f9e44","belly":"#ebfbee","ears":"none","tail":"none","eyes":"sleepy","mark":"spots","extra":"crest"}'),
 ('scorchling','Scorchling','fire','uncommon','Soaks up the midday sun and glows.',42,14,9,12,'{desert}',14,3,2,'{"body":"round","c1":"#ff6b6b","c2":"#c92a2a","belly":"#ffe3e3","ears":"horn","tail":"flame","eyes":"fierce","mark":"none","extra":"none"}'),
 ('sandwisp','Sandwisp','air','rare','A swirling whisper of sand with a sleepy grin.',40,12,10,18,'{desert}',6,3,2,'{"body":"bean","c1":"#e9c46a","c2":"#f4a261","belly":"#fff3cd","ears":"none","tail":"curl","eyes":"cute","mark":"none","extra":"wings"}'),
 ('sunscarab','Sunscarab','light','rare','Its shell reflects light into dazzling rainbows.',52,13,17,8,'{desert}',5,4,3,'{"body":"wide","c1":"#ffd43b","c2":"#f08c00","belly":"#fff9db","ears":"horn","tail":"none","eyes":"fierce","mark":"gem","extra":"shell"}'),
 ('frostkit','Frostkit','ice','common','Its breath turns into tiny snowflakes.',44,10,11,10,'{snow}',28,3,1,'{"body":"tall","c1":"#a5d8ff","c2":"#4dabf7","belly":"#f1f9ff","ears":"pointy","tail":"curl","eyes":"cute","mark":"none","extra":"none"}'),
 ('snowpuff','Snowpuff','ice','common','Rolls down hills and calls it a game.',50,9,13,7,'{snow}',26,3,1,'{"body":"round","c1":"#f1f3f5","c2":"#ced4da","belly":"#ffffff","ears":"round","tail":"none","eyes":"sleepy","mark":"cheeks","extra":"none"}'),
 ('duskbat','Duskbat','shadow','uncommon','Hangs upside down and tells spooky (harmless) stories.',38,13,9,15,'{snow}',14,3,2,'{"body":"round","c1":"#845ef7","c2":"#5f3dc4","belly":"#d0bfff","ears":"pointy","tail":"none","eyes":"fierce","mark":"none","extra":"wings"}'),
 ('crystalynx','Crystalynx','crystal','rare','Its fur grows tiny crystals that chime when it purrs.',50,14,15,12,'{snow}',6,4,3,'{"body":"tall","c1":"#66d9e8","c2":"#1098ad","belly":"#e3fafc","ears":"pointy","tail":"curl","eyes":"fierce","mark":"gem","extra":"crest"}'),
 ('aurorix','Aurorix','light','legendary','Said to paint the northern lights across the sky.',80,18,18,16,'{snow}',1,5,3,'{"body":"tall","c1":"#74c0fc","c2":"#9775fa","belly":"#fff0f6","ears":"long","tail":"curl","eyes":"cute","mark":"gem","extra":"wings"}')
on conflict (id) do nothing;

-- starter question bank (English). Teachers/admins add more from /monster-quest/questions.
insert into public.mq_questions (type, subject, topic, grade, difficulty, prompt, passage, tts_text, options, answer, explanation, xp_reward, time_limit_s)
select * from (values
 ('mcq','English','Vocabulary',null::int,1,'What is the opposite of "happy"?',null,null,'["sad","big","fast","strong"]'::jsonb,'"sad"'::jsonb,'Sad is the opposite of happy.',5,null::int),
 ('mcq','English','Vocabulary',null,1,'Which word means "very big"?',null,null,'["tiny","huge","quiet","slow"]','"huge"','Huge means very big.',5,null),
 ('mcq','English','Vocabulary',null,2,'What does "ancient" mean?',null,null,'["very old","very new","very loud","very cold"]','"very old"','Ancient things are from a very long time ago.',6,null),
 ('mcq','English','Vocabulary',null,2,'Choose the synonym of "begin".',null,null,'["finish","start","hide","wait"]','"start"','Begin and start mean the same thing.',6,null),
 ('mcq','English','Vocabulary',null,3,'What does "reluctant" mean?',null,null,'["eager","unwilling","careful","jealous"]','"unwilling"','A reluctant person does not want to do something.',8,null),
 ('mcq','English','Vocabulary',null,3,'Which word is closest in meaning to "fragile"?',null,null,'["delicate","enormous","ordinary","ancient"]','"delicate"','Fragile things break easily; delicate is the closest.',8,null),
 ('mcq','English','Vocabulary',null,4,'What does "meticulous" mean?',null,null,'["careless","showing great attention to detail","very angry","extremely quick"]','"showing great attention to detail"','A meticulous person is very careful and precise.',10,null),
 ('mcq','English','Vocabulary',null,4,'Which word is an antonym of "scarce"?',null,null,'["plentiful","rare","tiny","silent"]','"plentiful"','Scarce means hard to find; plentiful means there is a lot.',10,null),
 ('mcq','English','Grammar',null,1,'Which sentence is correct?',null,null,'["She go to school.","She goes to school.","She going to school.","She gone to school."]','"She goes to school."','Use "goes" with he/she/it in the present simple.',5,null),
 ('mcq','English','Grammar',null,2,'Choose the correct plural of "child".',null,null,'["childs","childes","children","childrens"]','"children"','Child has an irregular plural: children.',6,null),
 ('mcq','English','Grammar',null,3,'Which sentence uses the past perfect correctly?',null,null,'["I had finished before she arrived.","I have finish before she arrived.","I finishing before she arrived.","I had finish before she arrived."]','"I had finished before she arrived."','Past perfect = had + past participle.',8,null),
 ('mcq','English','Grammar',null,4,'Which sentence contains a correctly used semicolon?',null,null,'["I love tea; she prefers coffee.","I love; tea she prefers coffee.","I love tea; and she prefers coffee.","I; love tea she prefers coffee."]','"I love tea; she prefers coffee."','A semicolon joins two closely related independent clauses.',10,null),
 ('fill_blank','English','Grammar',null,1,'Fill in the blank: The cat ___ sleeping on the sofa. (is / are)',null,null,null,'["is"]','Cat is singular, so we use "is".',5,20),
 ('fill_blank','English','Grammar',null,2,'Fill in the blank: She ___ her homework yesterday. (do)',null,null,null,'["did"]','Past simple of "do" is "did".',6,20),
 ('fill_blank','English','Grammar',null,3,'Fill in the blank: If I ___ you, I would study harder. (be)',null,null,null,'["were"]','The second conditional uses "were" for all subjects.',8,25),
 ('fill_blank','English','Vocabulary',null,2,'Fill in the blank: A baby cow is called a ___.',null,null,null,'["calf"]','A baby cow is a calf.',6,20),
 ('true_false','English','Grammar',null,1,'True or false: "Their" and "there" mean the same thing.',null,null,null,'"False"','"Their" shows possession; "there" shows place.',4,15),
 ('true_false','English','Literature',null,2,'True or false: A metaphor says one thing IS another thing.',null,null,null,'"True"','A metaphor compares without using like or as.',5,15),
 ('true_false','English','Literature',null,3,'True or false: "As brave as a lion" is a metaphor.',null,null,null,'"False"','It uses "as", so it is a simile.',7,15),
 ('true_false','English','Grammar',null,2,'True or false: "Fewer" is used with countable nouns.',null,null,null,'"True"','Use fewer with countable things (fewer apples), less with uncountable (less water).',6,15),
 ('spelling','English','Spelling',null,1,'Listen and spell the word.',null,'beautiful',null,'["beautiful"]','Beautiful: b-e-a-u-t-i-f-u-l.',6,40),
 ('spelling','English','Spelling',null,2,'Listen and spell the word.',null,'necessary',null,'["necessary"]','Necessary has one c and two s.',7,40),
 ('spelling','English','Spelling',null,3,'Listen and spell the word.',null,'separate',null,'["separate"]','Separate: "a rat" in the middle.',8,40),
 ('spelling','English','Spelling',null,4,'Listen and spell the word.',null,'accommodate',null,'["accommodate"]','Accommodate has double c and double m.',10,45),
 ('type_answer','English','Vocabulary',null,2,'Type the word: a place where books are kept and borrowed.',null,null,null,'["library"]','A library lends books.',6,30),
 ('type_answer','English','Vocabulary',null,3,'Type the word: a word that means the same as "enormous" (starts with h).',null,null,null,'["huge","humongous","hefty"]','Huge is a synonym of enormous.',8,30),
 ('type_answer','English','Grammar',null,2,'Type the past tense of "go".',null,null,null,'["went"]','Go is irregular: went.',6,20),
 ('sentence_order','English','Grammar',null,1,'Put the words in order to make a sentence.',null,null,'["The","dog","runs","fast"]','["The","dog","runs","fast"]','Subject, verb, adverb.',6,40),
 ('sentence_order','English','Grammar',null,2,'Put the words in order to make a sentence.',null,null,'["I","like","to","read","books"]','["I","like","to","read","books"]','Subject + verb + infinitive + object.',7,45),
 ('sentence_order','English','Grammar',null,3,'Put the words in order to make a question.',null,null,'["Where","did","you","go","yesterday"]','["Where","did","you","go","yesterday"]','Question word + did + subject + verb.',8,45),
 ('word_match','English','Vocabulary',null,2,'Match each word with its meaning.',null,null,'{"left":["tiny","enormous","swift"]}','{"tiny":"very small","enormous":"very large","swift":"very fast"}','Match the word to its definition.',9,60),
 ('word_match','English','Vocabulary',null,3,'Match each word with its opposite.',null,null,'{"left":["ancient","generous","brave"]}','{"ancient":"modern","generous":"selfish","brave":"cowardly"}','Opposites (antonyms).',10,60),
 ('listening','English','Listening',null,1,'Listen. What animal did you hear about?',null,'I saw a big brown bear near the river.','["a bear","a fish","a horse","a rabbit"]','"a bear"','The speaker saw a big brown bear.',6,30),
 ('listening','English','Listening',null,2,'Listen. Where is Sara going?',null,'Sara is going to the library to return her books.','["the library","the park","the shop","the school"]','"the library"','Sara is going to the library.',7,30),
 ('listening','English','Listening',null,3,'Listen. Why was Omar late?',null,'Omar was late because his bus broke down on the way to school.','["His bus broke down","He woke up late","It was raining","He lost his bag"]','"His bus broke down"','Omar''s bus broke down.',8,35),
 ('reading','English','Reading',null,2,'Read the passage. Why did Lina take an umbrella?','Lina looked at the dark clouds in the sky. She remembered the weather report and quickly picked up her umbrella before leaving home.',null,'["It looked like rain","It was very sunny","She was going swimming","She wanted shade from the sun"]','"It looked like rain"','The dark clouds and the weather report suggest rain.',8,45),
 ('reading','English','Reading',null,3,'Read the passage. What is the main idea?','Bees visit flowers to collect nectar. While they move from flower to flower, pollen sticks to their bodies. This pollen helps plants make seeds and grow new flowers, so bees are very important to nature.',null,'["Bees help plants reproduce","Bees make honey for people","Flowers are colorful","Plants need lots of water"]','"Bees help plants reproduce"','The passage explains how bees spread pollen so plants can reproduce.',10,50)
) as v(type, subject, topic, grade, difficulty, prompt, passage, tts_text, options, answer, explanation, xp_reward, time_limit_s)
where not exists (select 1 from public.mq_questions where created_by is null limit 1);

grant execute on all functions in schema public to authenticated;
