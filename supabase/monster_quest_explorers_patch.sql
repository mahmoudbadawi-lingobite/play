-- Monster Quest: Treasure Hunt explorers, image props, and a fix for "those monsters are not yours".
-- Run once in the Supabase SQL editor (safe to re-run), after monster_quest_roster_patch.sql.
begin;

-- 1. Explorers = the six Treasure Hunt explorers. First pick is free; the others are bought and kept.
insert into public.mq_cosmetics (key, slot, name, price_coins, price_gems, unlock_level, data, sort, active) values
('char_pink','character','Rawan',150,null,1,'{"char":"pink"}'::jsonb,200,true),
('char_goggles','character','Nour',200,null,1,'{"char":"goggles"}'::jsonb,201,true),
('char_hijab','character','Mayar',250,null,1,'{"char":"hijab"}'::jsonb,202,true),
('char_redcap','character','Mohamed',300,null,1,'{"char":"redcap"}'::jsonb,203,true),
('char_flower','character','Mariam',350,null,1,'{"char":"flower"}'::jsonb,204,true),
('char_robot','character','Robo',450,null,1,'{"char":"robot"}'::jsonb,205,true)
on conflict (key) do update set slot=excluded.slot, name=excluded.name, price_coins=excluded.price_coins, price_gems=excluded.price_gems,
  unlock_level=excluded.unlock_level, data=excluded.data, sort=excluded.sort, active=true;

-- the earlier explorers are retired; players who had one choose a new free explorer next time they enter the world
update public.mq_cosmetics set active = false where slot = 'character' and key not in ('char_pink','char_goggles','char_hijab','char_redcap','char_flower','char_robot');
delete from public.mq_player_cosmetics pc using public.mq_cosmetics c
  where c.key = pc.cosmetic_key and c.slot = 'character' and not c.active;
update public.mq_players set outfit = outfit - 'character'
  where outfit ? 'character' and not exists (select 1 from public.mq_cosmetics c where c.key = outfit->>'character' and c.active);

-- 2. The first (drawn) props are retired. Coins spent on them are refunded; new image props come from monster_quest_props.sql.
with gone as (
  delete from public.mq_player_cosmetics pc using public.mq_cosmetics c
   where c.key = pc.cosmetic_key and c.key like 'prop\_%' and c.slot like 'prop\_%'
   returning pc.user_id, coalesce(c.price_coins, 0) as coins
)
update public.mq_players p set coins = p.coins + g.total
  from (select user_id, sum(coins) as total from gone group by user_id) g where p.user_id = g.user_id;
update public.mq_cosmetics set active = false where key like 'prop\_%' and slot like 'prop\_%';
do $$ declare s text; begin
  foreach s in array array['prop_head','prop_face','prop_neck','prop_back'] loop
    update public.mq_players set outfit = outfit - s
     where outfit ? s and not exists (select 1 from public.mq_cosmetics c where c.key = outfit->>s and c.active);
  end loop;
end $$;

-- 3. First explorer is free, once per player (only counts explorers that still exist)
create or replace function public.mq_choose_character(p_key text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); c public.mq_cosmetics;
begin
  if uid is null then raise exception 'sign in first'; end if;
  select * into c from public.mq_cosmetics where key = p_key and slot = 'character' and active;
  if c.key is null then raise exception 'unknown explorer'; end if;
  if not exists (select 1 from public.mq_players where user_id = uid) then raise exception 'open Monster Quest first'; end if;
  if exists (select 1 from public.mq_player_cosmetics pc join public.mq_cosmetics k on k.key = pc.cosmetic_key
             where pc.user_id = uid and k.slot = 'character' and k.active) then
    raise exception 'you already chose your first explorer';
  end if;
  insert into public.mq_player_cosmetics (user_id, cosmetic_key) values (uid, c.key) on conflict do nothing;
  update public.mq_players set outfit = outfit || jsonb_build_object('character', c.key) where user_id = uid;
  return mq_state();
end;
$$;

-- 4. "those monsters are not yours": the team list sent by the app can be out of date (a monster was released, or the page
--    was open on another device). The team is now saved from whatever in the list still belongs to the player.
create or replace function public.mq_set_team(p_ids uuid[])
returns void language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); ids uuid[]; i int;
begin
  select coalesce(array_agg(x.id order by x.ord), '{}') into ids from (
    select distinct on (u.id) u.id, u.ord
      from unnest(coalesce(p_ids, '{}')) with ordinality as u(id, ord)
      join public.mq_player_monsters m on m.id = u.id and m.user_id = uid
     order by u.id, u.ord) x;
  ids := coalesce(ids[1:6], '{}');
  update public.mq_player_monsters set team_slot = null where user_id = uid;
  for i in 1 .. coalesce(cardinality(ids), 0) loop
    update public.mq_player_monsters set team_slot = i where id = ids[i] and user_id = uid;
  end loop;
end;
$$;

grant execute on all functions in schema public to authenticated;
commit;
