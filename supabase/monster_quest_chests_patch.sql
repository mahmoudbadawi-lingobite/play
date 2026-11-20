-- Monster Quest: daily chest rewards.
-- Run once in the Supabase SQL editor (safe to re-run). Needs monster_quest_patch.sql first.
--
-- A chest gives one reward per player per day (UTC). The game sends a chest id like 'grove-roots:puzzle-chest';
-- the server decides the prize, so the client cannot change it. Limits: the world must be unlocked for the player's level,
-- and a player can claim at most 'chest_daily_max' different chests per day (stops made-up chest ids being used to farm).
-- Tuning (all optional, in mq_config): chest_coin_base (15), chest_coin_per_world (10), chest_orb_chance (0.3), chest_daily_max (40).
begin;

create table if not exists public.mq_chest_claims (
  user_id uuid not null references public.profiles(id) on delete cascade,
  chest_key text not null,
  claimed_on date not null,
  primary key (user_id, chest_key)
);
alter table public.mq_chest_claims enable row level security;
drop policy if exists "mq_chest_claims: own read" on public.mq_chest_claims;
create policy "mq_chest_claims: own read" on public.mq_chest_claims for select using (user_id = auth.uid());
grant select on public.mq_chest_claims to authenticated;

create or replace function public.mq_open_chest(p_chest text, p_world int, p_puzzle boolean default false)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  xp int; lvl int; need int; last_day date; today date := (now() at time zone 'utc')::date;
  v_coins int; v_gems int := 0; items jsonb := '{}'::jsonb; n_today int;
begin
  if uid is null then raise exception 'not signed in'; end if;
  if not exists (select 1 from public.mq_players where user_id = uid) then raise exception 'open Monster Quest first'; end if;
  if p_chest is null or length(p_chest) > 60 or p_chest !~ '^[a-z0-9_-]+(:[a-z0-9_-]+)?$' then raise exception 'that is not a chest'; end if;
  if p_world is null or p_world not between 1 and 6 then raise exception 'that is not a chest'; end if;

  select total_xp into xp from public.profiles where id = uid;
  lvl := mq_level(coalesce(xp, 0));
  need := case p_world when 1 then 1 when 2 then 2 when 3 then 4 when 4 then 6 when 5 then 8 else 10 end;
  if lvl < need then raise exception 'this world is not open to you yet'; end if;

  select claimed_on into last_day from public.mq_chest_claims where user_id = uid and chest_key = p_chest for update;
  if last_day = today then return jsonb_build_object('already', true); end if;

  select count(*) into n_today from public.mq_chest_claims where user_id = uid and claimed_on = today;
  if n_today >= mq_cfg('chest_daily_max', 40)::int then raise exception 'you have opened enough chests today. More tomorrow!'; end if;

  insert into public.mq_chest_claims (user_id, chest_key, claimed_on) values (uid, p_chest, today)
  on conflict (user_id, chest_key) do update set claimed_on = excluded.claimed_on;

  v_coins := round((mq_cfg('chest_coin_base', 15) + p_world * mq_cfg('chest_coin_per_world', 10)) * (0.8 + random() * 0.5))::int;
  if p_puzzle then
    v_coins := v_coins * 3; v_gems := 1;
    items := jsonb_build_object('great_orb', 2);
  else
    if random() < mq_cfg('chest_orb_chance', 0.3) then items := jsonb_build_object('quest_orb', 1 + floor(random() * 2)::int); end if;
    if p_world >= 3 and random() < 0.1 then items := items || jsonb_build_object('great_orb', 1); end if;
  end if;

  update public.mq_players set coins = public.mq_players.coins + v_coins, gems = public.mq_players.gems + v_gems where user_id = uid;
  insert into public.mq_inventory (user_id, item_key, qty)
  select uid, k, v::int from jsonb_each_text(items) e(k, v)
  on conflict (user_id, item_key) do update set qty = public.mq_inventory.qty + excluded.qty;

  return jsonb_build_object('already', false, 'coins', v_coins, 'gems', v_gems, 'items', items);
end;
$$;

grant execute on function public.mq_open_chest(text, int, boolean) to authenticated;
commit;
