-- Monster Quest: the "Mr. Badawi" explorer. Level 10 and 1000 coins; never offered as the free first explorer.
-- Run once in the Supabase SQL editor (safe to re-run). Needs monster_quest_roster_patch.sql first.
begin;

insert into public.mq_cosmetics (key, slot, name, price_coins, price_gems, unlock_level, data, sort, active) values
('char_badawi','character','Mr. Badawi',1000,null,10,'{"char":"badawi"}'::jsonb,207,true)
on conflict (key) do update set slot=excluded.slot, name=excluded.name, price_coins=excluded.price_coins, price_gems=excluded.price_gems,
  unlock_level=excluded.unlock_level, data=excluded.data, sort=excluded.sort, active=true;

-- the free first explorer can only be one that is open from level 1 (so a locked explorer can never be chosen for free)
create or replace function public.mq_choose_character(p_key text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); c public.mq_cosmetics;
begin
  if uid is null then raise exception 'sign in first'; end if;
  select * into c from public.mq_cosmetics where key = p_key and slot = 'character' and active;
  if c.key is null then raise exception 'unknown explorer'; end if;
  if c.unlock_level > 1 then raise exception 'this explorer is not available as a first explorer'; end if;
  if not exists (select 1 from public.mq_players where user_id = uid) then raise exception 'open Monster Quest first'; end if;
  if exists (select 1 from public.mq_player_cosmetics pc join public.mq_cosmetics k on k.key = pc.cosmetic_key
             where pc.user_id = uid and k.slot = 'character') then
    raise exception 'you already chose your first explorer';
  end if;
  insert into public.mq_player_cosmetics (user_id, cosmetic_key) values (uid, c.key) on conflict do nothing;
  update public.mq_players set outfit = outfit || jsonb_build_object('character', c.key) where user_id = uid;
  return mq_state();
end;
$$;

grant execute on function public.mq_choose_character(text) to authenticated;
commit;
