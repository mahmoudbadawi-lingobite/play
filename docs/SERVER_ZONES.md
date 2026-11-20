# Server zones for worlds 3-6

Game side (done): Sandstone Reach asks `mq_start_encounter('desert')`, Frostglass Peaks `'snow'`, Tidewhisper Coast `'ocean'`,
Skyspire Crown `'sky'`. Worlds 1-2 use `'forest'`. If the database rejects a zone, `WorldView.tsx` retries with `'forest'`.

Database side: `desert`, `snow` and `ocean` already exist (monster_quest_patch + phase2) and the roster patch gives each of them
monsters. Only `sky` is new: run `supabase/monster_quest_world_zones_patch.sql` once. It creates the zone (unlock level 8,
monster levels 16-22) and adds `sky` to owly, drakko, zeezy, pixie, puffy and unicorny.

Arena pictures exist for desert, snow and ocean; `sky` has none and uses the forest arena
(add `public/monster-quest/arenas/sky.webp` and an entry in `scene/arenas.ts` to give it one).
