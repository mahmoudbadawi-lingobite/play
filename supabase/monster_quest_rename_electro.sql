-- Monster Quest: rename the monster "Zappy" to "Electro".
-- Run once in the Supabase SQL editor (safe to re-run). Only the displayed name changes: the internal id stays 'zappy',
-- so captured monsters, teams, sprites and animations all keep working, and every screen shows the new name.
-- (Monsters a player has nicknamed keep their nickname.)
update public.mq_species set name = 'Electro' where id = 'zappy';
