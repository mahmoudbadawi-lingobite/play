-- Monster Quest: encounter zone for World 6 (Skyspire Crown) + make sure worlds 3-5 have monsters.
-- Run once in the Supabase SQL editor (safe to re-run). Needs monster_quest_patch.sql, phase2 and roster patches first.
--
-- World -> server zone used by the game (LocationDef.serverZone):
--   1 Emberlands -> forest   2 Emerald Grove -> forest   (unchanged)
--   3 Sandstone Reach -> desert   (exists, unlock 2)
--   4 Frostglass Peaks -> snow    (exists, unlock 4)
--   5 Tidewhisper Coast -> ocean  (exists, unlock 7)
--   6 Skyspire Crown -> sky       (NEW, created below, unlock 8)
-- Each zone unlocks at or below its world's portal level (4 / 6 / 8 / 10), so nobody is blocked by the zone check.
begin;

insert into public.mq_zones (id, name, description, unlock_level, min_level, max_level, difficulty, palette, sort) values
  ('sky', 'Skyspire Crown', 'Floating islands, cloud bridges and winged monsters.', 8, 16, 22, 4,
   '{"grass":["#bfe3a8","#add996"],"path":["#f2dfb0","#e6cf9a"],"tall":"#8fd18a","tree":"#b07ad8","trunk":"#8a6a4a","rock":"#b7a9d6","water":"#7fd3f5","sky":["#8fd3ff","#f4e8ff"],"style":"tree","tree_density":0.08}'::jsonb, 9)
on conflict (id) do update set name = excluded.name, description = excluded.description, unlock_level = excluded.unlock_level,
  min_level = excluded.min_level, max_level = excluded.max_level, difficulty = excluded.difficulty, palette = excluded.palette, sort = excluded.sort, active = true;

-- who lives in the sky: winged and light monsters (adds 'sky' to their zone list, keeps their other zones)
update public.mq_species set zones = array_append(zones, 'sky')
 where id in ('owly', 'drakko', 'zeezy', 'pixie', 'puffy', 'unicorny') and not ('sky' = any(zones));

commit;

-- check: every world zone should show at least one monster that can spawn
-- select z.id, count(s.id) filter (where s.spawn_weight > 0) as spawnable
--   from public.mq_zones z left join public.mq_species s on s.active and z.id = any(s.zones)
--  where z.id in ('forest','desert','snow','ocean','sky') group by z.id order by z.id;
