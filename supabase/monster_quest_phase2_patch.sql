-- =====================================================================
-- MONSTER QUEST  -  Phase 2 migration  (run AFTER monster_quest_patch.sql)
-- Adds: 5 new worlds + 45 monsters, evolution, monster training & XP,
-- potions / XP candy / evolution stones, trainer wardrobe, daily & weekly
-- missions, and a server-authoritative turn-based battle engine (vs AI).
-- Safe to re-run.
-- =====================================================================

-- ------------------------------------------------------ schema changes
alter table public.mq_items drop constraint if exists mq_items_kind_check;
alter table public.mq_items add constraint mq_items_kind_check check (kind in ('ball','potion','booster','stone'));
alter table public.mq_items add column if not exists effect int not null default 0;
alter table public.mq_encounters drop constraint if exists mq_encounters_status_check;
alter table public.mq_encounters add constraint mq_encounters_status_check check (status in ('active','captured','escaped','fled','done'));
alter table public.mq_encounters add column if not exists kind text not null default 'wild';
alter table public.mq_encounters add column if not exists monster_id uuid;
alter table public.mq_species add column if not exists stage int not null default 1;
alter table public.mq_species add column if not exists evolves_to text;
alter table public.mq_species add column if not exists evolve_level int;
alter table public.mq_species add column if not exists evolve_item text;
alter table public.mq_players add column if not exists outfit jsonb not null default '{}'::jsonb;
alter table public.mq_players add column if not exists battles_won int not null default 0;
alter table public.mq_players add column if not exists battles_lost int not null default 0;

create table if not exists public.mq_cosmetics (
  key text primary key, slot text not null, name text not null,
  price_coins int, price_gems int, unlock_level int not null default 1,
  data jsonb not null, sort int not null default 0, active boolean not null default true
);
create table if not exists public.mq_player_cosmetics (
  user_id uuid not null references public.profiles(id) on delete cascade,
  cosmetic_key text not null references public.mq_cosmetics(key),
  acquired_at timestamptz not null default now(),
  primary key (user_id, cosmetic_key)
);
create table if not exists public.mq_type_chart (
  attacker text not null, defender text not null, mult numeric not null,
  primary key (attacker, defender)
);
create table if not exists public.mq_missions (
  key text primary key, title text not null, period text not null check (period in ('daily','weekly')),
  kind text not null check (kind in ('answer','capture','battle','train','evolve')),
  target int not null check (target > 0), reward_coins int not null default 0, reward_gems int not null default 0,
  sort int not null default 0, active boolean not null default true
);
create table if not exists public.mq_player_missions (
  user_id uuid not null references public.profiles(id) on delete cascade,
  mission_key text not null references public.mq_missions(key) on delete cascade,
  period_start date not null,
  progress int not null default 0, claimed boolean not null default false,
  primary key (user_id, mission_key, period_start)
);
create table if not exists public.mq_battles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  zone_id text not null, difficulty text not null, opp_name text not null,
  status text not null default 'active' check (status in ('active','won','lost','forfeit')),
  player jsonb not null, opp jsonb not null,
  p_active int not null default 0, o_active int not null default 0, turn int not null default 1,
  pending_question uuid, pending_started_at timestamptz,
  result jsonb, created_at timestamptz not null default now(), ended_at timestamptz
);
create index if not exists mq_battles_user_idx on public.mq_battles (user_id, created_at desc);

alter table public.mq_cosmetics enable row level security;
alter table public.mq_player_cosmetics enable row level security;
alter table public.mq_type_chart enable row level security;
alter table public.mq_missions enable row level security;
alter table public.mq_player_missions enable row level security;
alter table public.mq_battles enable row level security;

drop policy if exists "mq_cosmetics: read" on public.mq_cosmetics;
create policy "mq_cosmetics: read" on public.mq_cosmetics for select using (auth.uid() is not null);
drop policy if exists "mq_cosmetics: admin writes" on public.mq_cosmetics;
create policy "mq_cosmetics: admin writes" on public.mq_cosmetics for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "mq_type_chart: read" on public.mq_type_chart;
create policy "mq_type_chart: read" on public.mq_type_chart for select using (auth.uid() is not null);
drop policy if exists "mq_type_chart: admin writes" on public.mq_type_chart;
create policy "mq_type_chart: admin writes" on public.mq_type_chart for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "mq_missions: read" on public.mq_missions;
create policy "mq_missions: read" on public.mq_missions for select using (auth.uid() is not null);
drop policy if exists "mq_missions: admin writes" on public.mq_missions;
create policy "mq_missions: admin writes" on public.mq_missions for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "mq_player_cosmetics: own read" on public.mq_player_cosmetics;
create policy "mq_player_cosmetics: own read" on public.mq_player_cosmetics for select using (user_id = auth.uid());
drop policy if exists "mq_player_missions: own or staff read" on public.mq_player_missions;
create policy "mq_player_missions: own or staff read" on public.mq_player_missions for select using (
  user_id = auth.uid() or public.is_admin()
  or exists (select 1 from public.class_students cs join public.classes c on c.id = cs.class_id
             where cs.student_id = mq_player_missions.user_id and c.teacher_id = auth.uid()));
drop policy if exists "mq_battles: own or staff read" on public.mq_battles;
create policy "mq_battles: own or staff read" on public.mq_battles for select using (
  user_id = auth.uid() or public.is_admin()
  or exists (select 1 from public.class_students cs join public.classes c on c.id = cs.class_id
             where cs.student_id = mq_battles.user_id and c.teacher_id = auth.uid()));
grant select on public.mq_cosmetics, public.mq_player_cosmetics, public.mq_type_chart, public.mq_missions, public.mq_player_missions, public.mq_battles to authenticated;
grant insert, update, delete on public.mq_cosmetics, public.mq_type_chart, public.mq_missions to authenticated;

-- --------------------------------------------------------------- config
insert into public.mq_config (key, value, note) values
  ('train_daily_sessions', 15, 'training sessions per day'),
  ('train_questions', 5, 'questions in a training session'),
  ('battle_daily_xp_cap', 250, 'max trainer XP from battles per day'),
  ('special_xp', 3, 'trainer XP for a correct special-attack answer')
on conflict (key) do nothing;

-- ---------------------------------------------------------------- zones
update public.mq_zones set palette = palette || '{"style":"tree"}'::jsonb where id = 'forest';
update public.mq_zones set palette = palette || '{"style":"cactus"}'::jsonb where id = 'desert';
update public.mq_zones set palette = palette || '{"style":"pine"}'::jsonb where id = 'snow';
insert into public.mq_zones (id, name, description, unlock_level, min_level, max_level, difficulty, palette, sort) values
  ('jungle', 'Emerald Jungle', 'Dense vines, loud birds and sneaky shadows.', 5, 10, 16, 3,
   '{"grass":["#3fae5f","#349a52"],"path":["#b98b5a","#a87c4d"],"tall":"#1e7a3c","tree":"#1f8a4c","trunk":"#6b4423","rock":"#7d8a7a","water":"#2fb8a5","sky":["#a9e6c1","#e3f7d7"],"style":"palm","water_bias":-0.04,"tree_density":0.14}'::jsonb, 4),
  ('volcano', 'Cinder Volcano', 'Rivers of lava and monsters that love the heat.', 6, 14, 20, 4,
   '{"grass":["#6b5b57","#5e4f4b"],"path":["#a08070","#917162"],"tall":"#b5472b","tree":"#3d2f2c","trunk":"#2a201e","rock":"#8a7468","water":"#ff6b2c","sky":["#ffb27a","#ffe0b8"],"style":"rock","liquid":"lava","water_bias":-0.03,"tree_density":0.1}'::jsonb, 5),
  ('ocean', 'Coral Coast', 'Beaches, tide pools and lots and lots of water.', 7, 12, 18, 3,
   '{"grass":["#f6e3a8","#efd993"],"path":["#e8c987","#dcb975"],"tall":"#2fb59a","tree":"#2fa56a","trunk":"#8a5a2b","rock":"#b0bec5","water":"#2d9cdb","sky":["#9fe3ff","#e4f8ff"],"style":"palm","water_bias":-0.14,"tree_density":0.07}'::jsonb, 6),
  ('crystal', 'Crystal Cave', 'Glittering caverns where light bends and bounces.', 8, 18, 24, 4,
   '{"grass":["#4b3f7a","#43386d"],"path":["#7a6bb5","#6c5da8"],"tall":"#9775fa","tree":"#74c0fc","trunk":"#4263eb","rock":"#5c4d93","water":"#3b5bdb","sky":["#2d2160","#5b43a8"],"style":"crystal","tree_density":0.12}'::jsonb, 7),
  ('city', 'Monster City', 'Neon streets, busy robots and big-city monsters.', 10, 20, 28, 5,
   '{"grass":["#8f9aa8","#818c9a"],"path":["#566274","#4b5667"],"tall":"#37b24d","tree":"#5c7cfa","trunk":"#364fc7","rock":"#adb5bd","water":"#4dabf7","sky":["#243b6b","#7b8cc4"],"style":"building","water_bias":0.04,"tree_density":0.1}'::jsonb, 8)
on conflict (id) do update set palette = excluded.palette, unlock_level = excluded.unlock_level, min_level = excluded.min_level, max_level = excluded.max_level, difficulty = excluded.difficulty, description = excluded.description;

insert into public.mq_species (id,name,type,rarity,description,base_hp,base_attack,base_defense,base_speed,zones,spawn_weight,capture_difficulty,required_correct,art,stage,evolves_to,evolve_level,evolve_item) values
('vinecub','Vinecub','grass','common','Swings through the canopy on its own sticky vines.',46,10,10,11,'{jungle}',28,3,1,'{"body":"round","c1":"#4cc26b","c2":"#1f8a4c","belly":"#e4f7b9","ears":"round","tail":"leaf","eyes":"cute","mark":"stripes","extra":"none"}',1,null,null,null),
('beakling','Beakling','air','common','Chatters happily and mimics every sound it hears.',40,10,8,15,'{jungle}',26,3,1,'{"body":"round","c1":"#ffa94d","c2":"#e8590c","belly":"#fff4e0","ears":"pointy","tail":"none","eyes":"cute","mark":"cheeks","extra":"wings"}',1,null,null,null),
('mangrovi','Mangrovi','water','uncommon','Lives among mangrove roots and loves muddy puddles.',50,11,13,8,'{jungle}',14,3,2,'{"body":"wide","c1":"#3bb0b0","c2":"#1b7a7a","belly":"#d3f7f1","ears":"round","tail":"fin","eyes":"sleepy","mark":"spots","extra":"none"}',1,null,null,null),
('shadowpaw','Shadowpaw','shadow','uncommon','A silent jungle cat that melts into the shade.',42,14,9,16,'{jungle}',12,3,2,'{"body":"tall","c1":"#5a4b8a","c2":"#2f2557","belly":"#c9bff0","ears":"pointy","tail":"curl","eyes":"fierce","mark":"stripes","extra":"none"}',1,null,null,null),
('orchidra','Orchidra','grass','rare','A flower-crowned guardian that blooms when it is happy.',58,14,14,10,'{jungle}',5,4,2,'{"body":"bean","c1":"#f06595","c2":"#a61e4d","belly":"#ffe3ec","ears":"horn","tail":"leaf","eyes":"cute","mark":"gem","extra":"crest"}',1,null,null,null),
('sunparrot','Sunparrot','light','rare','Its feathers glow like a tropical sunrise.',44,15,10,17,'{jungle}',5,4,3,'{"body":"tall","c1":"#ffd43b","c2":"#f76707","belly":"#fff9db","ears":"long","tail":"curl","eyes":"cute","mark":"gem","extra":"wings"}',1,null,null,null),
('cindermouse','Cindermouse','fire','common','Leaves tiny sparks wherever it scurries.',40,12,8,15,'{volcano}',28,3,1,'{"body":"round","c1":"#ff8a65","c2":"#d9480f","belly":"#ffe8cc","ears":"round","tail":"flame","eyes":"cute","mark":"cheeks","extra":"none"}',1,null,null,null),
('lavaling','Lavaling','earth','uncommon','A blob of cooling lava with a heart of gold.',54,12,14,6,'{volcano}',14,4,2,'{"body":"wide","c1":"#e8590c","c2":"#7f2704","belly":"#ffd8a8","ears":"none","tail":"none","eyes":"sleepy","mark":"spots","extra":"none"}',1,null,null,null),
('magmaw','Magmaw','fire','uncommon','Gobbles hot rocks as a snack.',48,15,10,10,'{volcano}',14,4,2,'{"body":"wide","c1":"#fa5252","c2":"#a51111","belly":"#ffe3e3","ears":"horn","tail":"flame","eyes":"fierce","mark":"none","extra":"crest"}',1,null,null,null),
('ashwisp','Ashwisp','shadow','common','A drifting puff of smoke with curious eyes.',38,11,9,14,'{volcano}',24,3,1,'{"body":"bean","c1":"#868e96","c2":"#343a40","belly":"#dee2e6","ears":"none","tail":"curl","eyes":"sleepy","mark":"none","extra":"wings"}',1,null,null,null),
('obsidrake','Obsidrake','earth','rare','Scales sharper than glass and tougher than steel.',60,16,17,9,'{volcano}',5,5,3,'{"body":"wide","c1":"#495057","c2":"#212529","belly":"#adb5bd","ears":"horn","tail":"curl","eyes":"fierce","mark":"gem","extra":"shell"}',1,null,null,null),
('solaris','Solaris','fire','legendary','The living ember of the volcano, older than the mountain itself.',85,19,17,15,'{volcano}',1,5,3,'{"body":"tall","c1":"#ffd43b","c2":"#e8590c","belly":"#fff3bf","ears":"long","tail":"flame","eyes":"fierce","mark":"gem","extra":"wings"}',1,null,null,null),
('bubbleon','Bubbleon','water','common','Blows bubbles to hide from bigger monsters.',44,9,10,10,'{ocean}',28,3,1,'{"body":"round","c1":"#74c0fc","c2":"#1971c2","belly":"#e7f5ff","ears":"round","tail":"fin","eyes":"cute","mark":"cheeks","extra":"none"}',1,null,null,null),
('shellsprout','Shellsprout','water','common','Carries a tiny garden on its shell.',50,9,15,6,'{ocean}',26,3,1,'{"body":"wide","c1":"#63e6be","c2":"#087f5b","belly":"#e6fcf5","ears":"round","tail":"leaf","eyes":"sleepy","mark":"spots","extra":"shell"}',1,null,null,null),
('coralisk','Coralisk','water','uncommon','Grows coral that changes colour with its mood.',48,12,12,10,'{ocean}',14,3,2,'{"body":"tall","c1":"#ff8787","c2":"#c92a2a","belly":"#fff0f0","ears":"horn","tail":"fin","eyes":"cute","mark":"spots","extra":"crest"}',1,null,null,null),
('lumifin','Lumifin','light','uncommon','Its fins glow to guide lost sailors home.',44,12,10,15,'{ocean}',12,4,2,'{"body":"bean","c1":"#a5d8ff","c2":"#4263eb","belly":"#f3f0ff","ears":"none","tail":"fin","eyes":"cute","mark":"gem","extra":"wings"}',1,null,null,null),
('tideray','Tideray','water','rare','Glides through waves as if it were flying.',56,15,13,15,'{ocean}',5,4,3,'{"body":"wide","c1":"#4dabf7","c2":"#1864ab","belly":"#d0ebff","ears":"pointy","tail":"fin","eyes":"fierce","mark":"stripes","extra":"wings"}',1,null,null,null),
('leviathor','Leviathor','water','legendary','The deep-sea sovereign. Sailors say its song calms storms.',90,18,19,12,'{ocean}',1,5,3,'{"body":"tall","c1":"#339af0","c2":"#1c3d91","belly":"#d0ebff","ears":"long","tail":"fin","eyes":"fierce","mark":"gem","extra":"crest"}',1,null,null,null),
('geodin','Geodin','crystal','common','Curls into a ball that looks just like a geode.',46,10,14,6,'{crystal}',28,4,1,'{"body":"round","c1":"#b197fc","c2":"#6741d9","belly":"#f3f0ff","ears":"none","tail":"none","eyes":"sleepy","mark":"gem","extra":"crest"}',1,null,null,null),
('gleamole','Gleamole','earth','common','Tunnels everywhere, polishing gems with its nose.',48,12,12,8,'{crystal}',26,4,1,'{"body":"round","c1":"#a9825b","c2":"#6f4e37","belly":"#f1e1cc","ears":"round","tail":"none","eyes":"cute","mark":"cheeks","extra":"none"}',1,null,null,null),
('prismoth','Prismoth','light','uncommon','Its wings split light into every colour.',40,13,9,17,'{crystal}',14,4,2,'{"body":"bean","c1":"#e599f7","c2":"#9c36b5","belly":"#fff0ff","ears":"pointy","tail":"none","eyes":"cute","mark":"gem","extra":"wings"}',1,null,null,null),
('shardrake','Shardrake','crystal','rare','A small drake covered in razor crystals.',54,16,15,12,'{crystal}',6,5,3,'{"body":"tall","c1":"#66d9e8","c2":"#0b7285","belly":"#e3fafc","ears":"horn","tail":"curl","eyes":"fierce","mark":"gem","extra":"crest"}',1,null,null,null),
('nocturna','Nocturna','shadow','rare','Wakes only when the cave is perfectly dark.',46,17,11,16,'{crystal}',5,5,3,'{"body":"tall","c1":"#6741d9","c2":"#1b1464","belly":"#d0bfff","ears":"long","tail":"curl","eyes":"fierce","mark":"gem","extra":"wings"}',1,null,null,null),
('diamantis','Diamantis','crystal','legendary','A flawless living diamond that hums softly.',82,18,20,14,'{crystal}',1,5,3,'{"body":"round","c1":"#e7f5ff","c2":"#74c0fc","belly":"#ffffff","ears":"long","tail":"none","eyes":"cute","mark":"gem","extra":"crest"}',1,null,null,null),
('sparkbot','Sparkbot','electric','common','A scrap-built robot who loves a good zap.',42,12,10,14,'{city}',28,4,1,'{"body":"round","c1":"#adb5bd","c2":"#495057","belly":"#f1f3f5","ears":"round","tail":"bolt","eyes":"cute","mark":"gem","extra":"none"}',1,null,null,null),
('gearling','Gearling','earth','common','Its heart is a tiny clock that never stops.',48,11,14,7,'{city}',26,4,1,'{"body":"wide","c1":"#fcc419","c2":"#a6790f","belly":"#fff3bf","ears":"round","tail":"none","eyes":"sleepy","mark":"spots","extra":"none"}',1,null,null,null),
('neonyx','Neonyx','electric','uncommon','Glows in neon colours after dark.',42,14,10,17,'{city}',14,4,2,'{"body":"tall","c1":"#da77f2","c2":"#7048e8","belly":"#f8f0fc","ears":"pointy","tail":"bolt","eyes":"fierce","mark":"stripes","extra":"none"}',1,null,null,null),
('binbandit','Binbandit','shadow','common','A masked scavenger that raids the trash cans.',44,13,10,13,'{city}',24,4,1,'{"body":"round","c1":"#868e96","c2":"#212529","belly":"#ced4da","ears":"round","tail":"curl","eyes":"fierce","mark":"cheeks","extra":"none"}',1,null,null,null),
('windrunner','Windrunner','air','uncommon','Surfs the air between skyscrapers.',40,13,9,18,'{city}',12,4,2,'{"body":"bean","c1":"#66d9e8","c2":"#1971c2","belly":"#e3fafc","ears":"long","tail":"none","eyes":"cute","mark":"stripes","extra":"wings"}',1,null,null,null),
('voltking','Voltking','electric','epic','Rules the power grid. Do not touch its crown.',64,17,15,16,'{city}',3,5,3,'{"body":"tall","c1":"#ffd43b","c2":"#e67700","belly":"#fff9db","ears":"horn","tail":"bolt","eyes":"fierce","mark":"gem","extra":"crest"}',1,null,null,null),
('overclock','Overclock','electric','legendary','A city-sized spark that woke up one stormy night.',88,19,18,19,'{city}',1,5,3,'{"body":"tall","c1":"#4dabf7","c2":"#e64980","belly":"#fff0f6","ears":"long","tail":"bolt","eyes":"fierce","mark":"gem","extra":"wings"}',1,null,null,null),
('leafmane','Leafmane','grass','uncommon','A proud, leafy mane crowns this grown-up Sproutle.',0,0,0,0,'{}',0,3,2,'{"body":"tall","c1":"#71c461","c2":"#33803c","belly":"#e8f8c8","ears":"horn","tail":"leaf","eyes":"fierce","mark":"gem","extra":"crest"}',2,null,null,null),
('pebblord','Pebblord','earth','uncommon','Boulder-hard and surprisingly gentle.',0,0,0,0,'{}',0,3,2,'{"body":"wide","c1":"#a17e5f","c2":"#68452e","belly":"#e6ccb2","ears":"horn","tail":"none","eyes":"fierce","mark":"gem","extra":"crest"}',2,null,null,null),
('gustwing','Gustwing','air','uncommon','Rides the strongest winds with outstretched wings.',0,0,0,0,'{}',0,3,2,'{"body":"tall","c1":"#8ec0ea","c2":"#498ac3","belly":"#ffffff","ears":"horn","tail":"none","eyes":"fierce","mark":"gem","extra":"wings"}',2,null,null,null),
('tidalon','Tidalon','water','rare','Commands small tides wherever it goes.',0,0,0,0,'{}',0,3,2,'{"body":"wide","c1":"#469de3","c2":"#1667af","belly":"#d0ebff","ears":"horn","tail":"fin","eyes":"fierce","mark":"gem","extra":"crest"}',2,null,null,null),
('blazefox','Blazefox','fire','rare','Its tail blazes like a bonfire when it is excited.',0,0,0,0,'{}',0,3,2,'{"body":"tall","c1":"#ea8627","c2":"#be4809","belly":"#ffe8cc","ears":"long","tail":"flame","eyes":"fierce","mark":"gem","extra":"crest"}',2,null,null,null),
('voltstorm','Voltstorm','electric','rare','A walking thunderstorm. Keep your hair flat.',0,0,0,0,'{}',0,3,2,'{"body":"wide","c1":"#33c79b","c2":"#0e966d","belly":"#fff3bf","ears":"long","tail":"bolt","eyes":"fierce","mark":"stripes","extra":"crest"}',2,null,null,null),
('glacierfang','Glacierfang','ice','uncommon','Its icy fangs can freeze a lake in a breath.',0,0,0,0,'{}',0,3,2,'{"body":"tall","c1":"#97c6ea","c2":"#3f8cca","belly":"#f1f9ff","ears":"long","tail":"curl","eyes":"fierce","mark":"gem","extra":"crest"}',2,null,null,null),
('duneguard','Duneguard','earth','uncommon','Guards the desert oases from sandstorms.',0,0,0,0,'{}',0,3,2,'{"body":"tall","c1":"#e09559","c2":"#a4642f","belly":"#fde8cf","ears":"long","tail":"curl","eyes":"fierce","mark":"gem","extra":"crest"}',2,null,null,null),
('nightwing','Nightwing','shadow','rare','Soars silently across moonlit skies.',0,0,0,0,'{}',0,3,2,'{"body":"tall","c1":"#7956e3","c2":"#4d32a0","belly":"#d0bfff","ears":"long","tail":"none","eyes":"fierce","mark":"gem","extra":"wings"}',2,null,null,null),
('bramblebeast','Bramblebeast','grass','uncommon','A thorny jungle giant with a soft heart.',0,0,0,0,'{}',0,3,2,'{"body":"tall","c1":"#45b262","c2":"#19713e","belly":"#e4f7b9","ears":"horn","tail":"leaf","eyes":"fierce","mark":"stripes","extra":"crest"}',2,null,null,null),
('cinderlord','Cinderlord','fire','uncommon','Ruler of the ember fields.',0,0,0,0,'{}',0,3,2,'{"body":"tall","c1":"#ea7e5c","c2":"#b13b0c","belly":"#ffe8cc","ears":"horn","tail":"flame","eyes":"fierce","mark":"gem","extra":"crest"}',2,null,null,null),
('aquarex','Aquarex','water','uncommon','Makes bubbles big enough to ride.',0,0,0,0,'{}',0,3,2,'{"body":"tall","c1":"#6ab0e7","c2":"#145c9f","belly":"#e7f5ff","ears":"horn","tail":"fin","eyes":"fierce","mark":"gem","extra":"crest"}',2,null,null,null),
('geomancer','Geomancer','crystal','uncommon','Its crystal shell resonates with ancient songs.',0,0,0,0,'{}',0,3,2,'{"body":"tall","c1":"#a28ae7","c2":"#5435b1","belly":"#f3f0ff","ears":"horn","tail":"none","eyes":"fierce","mark":"gem","extra":"crest"}',2,null,null,null),
('sparkmech','Sparkmech','electric','uncommon','Upgraded with extra circuits and extra sass.',0,0,0,0,'{}',0,3,2,'{"body":"tall","c1":"#9fa6ad","c2":"#3b4147","belly":"#f1f3f5","ears":"horn","tail":"bolt","eyes":"fierce","mark":"gem","extra":"crest"}',2,null,null,null)
on conflict (id) do nothing;

-- evolved species: stats = pre-evolution base + boost, rarity-appropriate
update public.mq_species e set base_hp=b.base_hp+14, base_attack=b.base_attack+6, base_defense=b.base_defense+6, base_speed=b.base_speed+5, capture_difficulty=least(5,b.capture_difficulty+1) from public.mq_species b where e.id='leafmane' and b.id='sproutle' and e.base_hp=0;
update public.mq_species e set base_hp=b.base_hp+14, base_attack=b.base_attack+6, base_defense=b.base_defense+6, base_speed=b.base_speed+5, capture_difficulty=least(5,b.capture_difficulty+1) from public.mq_species b where e.id='pebblord' and b.id='pebblin' and e.base_hp=0;
update public.mq_species e set base_hp=b.base_hp+14, base_attack=b.base_attack+6, base_defense=b.base_defense+6, base_speed=b.base_speed+5, capture_difficulty=least(5,b.capture_difficulty+1) from public.mq_species b where e.id='gustwing' and b.id='puffwing' and e.base_hp=0;
update public.mq_species e set base_hp=b.base_hp+14, base_attack=b.base_attack+6, base_defense=b.base_defense+6, base_speed=b.base_speed+5, capture_difficulty=least(5,b.capture_difficulty+1) from public.mq_species b where e.id='tidalon' and b.id='splashet' and e.base_hp=0;
update public.mq_species e set base_hp=b.base_hp+14, base_attack=b.base_attack+6, base_defense=b.base_defense+6, base_speed=b.base_speed+5, capture_difficulty=least(5,b.capture_difficulty+1) from public.mq_species b where e.id='blazefox' and b.id='emberkit' and e.base_hp=0;
update public.mq_species e set base_hp=b.base_hp+14, base_attack=b.base_attack+6, base_defense=b.base_defense+6, base_speed=b.base_speed+5, capture_difficulty=least(5,b.capture_difficulty+1) from public.mq_species b where e.id='voltstorm' and b.id='zapling' and e.base_hp=0;
update public.mq_species e set base_hp=b.base_hp+14, base_attack=b.base_attack+6, base_defense=b.base_defense+6, base_speed=b.base_speed+5, capture_difficulty=least(5,b.capture_difficulty+1) from public.mq_species b where e.id='glacierfang' and b.id='frostkit' and e.base_hp=0;
update public.mq_species e set base_hp=b.base_hp+14, base_attack=b.base_attack+6, base_defense=b.base_defense+6, base_speed=b.base_speed+5, capture_difficulty=least(5,b.capture_difficulty+1) from public.mq_species b where e.id='duneguard' and b.id='dunepup' and e.base_hp=0;
update public.mq_species e set base_hp=b.base_hp+14, base_attack=b.base_attack+6, base_defense=b.base_defense+6, base_speed=b.base_speed+5, capture_difficulty=least(5,b.capture_difficulty+1) from public.mq_species b where e.id='nightwing' and b.id='duskbat' and e.base_hp=0;
update public.mq_species e set base_hp=b.base_hp+14, base_attack=b.base_attack+6, base_defense=b.base_defense+6, base_speed=b.base_speed+5, capture_difficulty=least(5,b.capture_difficulty+1) from public.mq_species b where e.id='bramblebeast' and b.id='vinecub' and e.base_hp=0;
update public.mq_species e set base_hp=b.base_hp+14, base_attack=b.base_attack+6, base_defense=b.base_defense+6, base_speed=b.base_speed+5, capture_difficulty=least(5,b.capture_difficulty+1) from public.mq_species b where e.id='cinderlord' and b.id='cindermouse' and e.base_hp=0;
update public.mq_species e set base_hp=b.base_hp+14, base_attack=b.base_attack+6, base_defense=b.base_defense+6, base_speed=b.base_speed+5, capture_difficulty=least(5,b.capture_difficulty+1) from public.mq_species b where e.id='aquarex' and b.id='bubbleon' and e.base_hp=0;
update public.mq_species e set base_hp=b.base_hp+14, base_attack=b.base_attack+6, base_defense=b.base_defense+6, base_speed=b.base_speed+5, capture_difficulty=least(5,b.capture_difficulty+1) from public.mq_species b where e.id='geomancer' and b.id='geodin' and e.base_hp=0;
update public.mq_species e set base_hp=b.base_hp+14, base_attack=b.base_attack+6, base_defense=b.base_defense+6, base_speed=b.base_speed+5, capture_difficulty=least(5,b.capture_difficulty+1) from public.mq_species b where e.id='sparkmech' and b.id='sparkbot' and e.base_hp=0;
update public.mq_species set evolves_to='leafmane', evolve_level=8, evolve_item=null where id='sproutle';
update public.mq_species set evolves_to='pebblord', evolve_level=10, evolve_item=null where id='pebblin';
update public.mq_species set evolves_to='gustwing', evolve_level=10, evolve_item=null where id='puffwing';
update public.mq_species set evolves_to='tidalon', evolve_level=12, evolve_item=null where id='splashet';
update public.mq_species set evolves_to='blazefox', evolve_level=10, evolve_item=null where id='emberkit';
update public.mq_species set evolves_to='voltstorm', evolve_level=null, evolve_item='evolution_stone' where id='zapling';
update public.mq_species set evolves_to='glacierfang', evolve_level=14, evolve_item=null where id='frostkit';
update public.mq_species set evolves_to='duneguard', evolve_level=12, evolve_item=null where id='dunepup';
update public.mq_species set evolves_to='nightwing', evolve_level=14, evolve_item=null where id='duskbat';
update public.mq_species set evolves_to='bramblebeast', evolve_level=16, evolve_item=null where id='vinecub';
update public.mq_species set evolves_to='cinderlord', evolve_level=16, evolve_item=null where id='cindermouse';
update public.mq_species set evolves_to='aquarex', evolve_level=16, evolve_item=null where id='bubbleon';
update public.mq_species set evolves_to='geomancer', evolve_level=18, evolve_item=null where id='geodin';
update public.mq_species set evolves_to='sparkmech', evolve_level=20, evolve_item=null where id='sparkbot';

insert into public.mq_cosmetics (key,slot,name,price_coins,price_gems,unlock_level,data,sort) values
('skin_light','skin','Light',0,null,1,'{"skin":"#fbd5b5"}'::jsonb,1),
('skin_tan','skin','Tan',0,null,1,'{"skin":"#e0ac7e"}'::jsonb,2),
('skin_warm','skin','Warm',0,null,1,'{"skin":"#c98f5f"}'::jsonb,3),
('skin_brown','skin','Brown',0,null,1,'{"skin":"#9a6a45"}'::jsonb,4),
('skin_deep','skin','Deep',0,null,1,'{"skin":"#6b4430"}'::jsonb,5),
('skin_peach','skin','Peach',0,null,1,'{"skin":"#f6c9a0"}'::jsonb,6),
('hair_brown','haircolor','Brown',0,null,1,'{"hair":"#5b3a29"}'::jsonb,7),
('hair_black','haircolor','Black',0,null,1,'{"hair":"#22223b"}'::jsonb,8),
('hair_blonde','haircolor','Blonde',0,null,1,'{"hair":"#e9b949"}'::jsonb,9),
('hair_red','haircolor','Red',0,null,1,'{"hair":"#c0392b"}'::jsonb,10),
('hair_blue','haircolor','Blue',60,null,1,'{"hair":"#3b82f6"}'::jsonb,11),
('hair_pink','haircolor','Pink',60,null,1,'{"hair":"#f06595"}'::jsonb,12),
('hair_green','haircolor','Green',60,null,1,'{"hair":"#40c057"}'::jsonb,13),
('hair_white','haircolor','Silver',60,null,1,'{"hair":"#dee2e6"}'::jsonb,14),
('style_short','hairstyle','Short',0,null,1,'{"hairStyle":"short"}'::jsonb,15),
('style_spiky','hairstyle','Spiky',0,null,1,'{"hairStyle":"spiky"}'::jsonb,16),
('style_long','hairstyle','Long',0,null,1,'{"hairStyle":"long"}'::jsonb,17),
('style_ponytail','hairstyle','Ponytail',40,null,1,'{"hairStyle":"ponytail"}'::jsonb,18),
('style_bun','hairstyle','Bun',40,null,1,'{"hairStyle":"bun"}'::jsonb,19),
('body_boy','body','Boy',0,null,1,'{"gender":"boy"}'::jsonb,20),
('body_girl','body','Girl',0,null,1,'{"gender":"girl"}'::jsonb,21),
('hat_cap_blue','hat','Blue cap',0,null,1,'{"hat":"cap","hatColor":"#2563eb"}'::jsonb,22),
('hat_cap_red','hat','Red cap',0,null,1,'{"hat":"cap","hatColor":"#e03131"}'::jsonb,23),
('hat_cap_green','hat','Green cap',50,null,1,'{"hat":"cap","hatColor":"#2f9e44"}'::jsonb,24),
('hat_beanie','hat','Orange beanie',80,null,2,'{"hat":"beanie","hatColor":"#f76707"}'::jsonb,25),
('hat_beanie_pink','hat','Pink beanie',80,null,2,'{"hat":"beanie","hatColor":"#f06595"}'::jsonb,26),
('hat_none','hat','No hat',0,null,1,'{"hat":"none","hatColor":"#000000"}'::jsonb,27),
('hat_wizard','hat','Wizard hat',200,null,5,'{"hat":"wizard","hatColor":"#5f3dc4"}'::jsonb,28),
('hat_crown','hat','Golden crown',null,6,8,'{"hat":"crown","hatColor":"#fcc419"}'::jsonb,29),
('top_blue','top','Blue jacket',0,null,1,'{"top":"#1e90ff"}'::jsonb,30),
('top_red','top','Red jacket',0,null,1,'{"top":"#e03131"}'::jsonb,31),
('top_green','top','Green jacket',60,null,1,'{"top":"#2f9e44"}'::jsonb,32),
('top_purple','top','Purple jacket',60,null,2,'{"top":"#7048e8"}'::jsonb,33),
('top_yellow','top','Sunny jacket',60,null,2,'{"top":"#fab005"}'::jsonb,34),
('top_pink','top','Pink jacket',60,null,2,'{"top":"#e64980"}'::jsonb,35),
('top_black','top','Night jacket',120,null,4,'{"top":"#212529"}'::jsonb,36),
('top_gold','top','Champion jacket',null,8,10,'{"top":"#f59f00"}'::jsonb,37),
('pants_navy','pants','Navy',0,null,1,'{"pants":"#34495e"}'::jsonb,38),
('pants_black','pants','Black',0,null,1,'{"pants":"#212529"}'::jsonb,39),
('pants_khaki','pants','Khaki',40,null,1,'{"pants":"#b08968"}'::jsonb,40),
('pants_red','pants','Red',40,null,1,'{"pants":"#c92a2a"}'::jsonb,41),
('pants_teal','pants','Teal',40,null,1,'{"pants":"#0b7285"}'::jsonb,42),
('shoes_orange','shoes','Orange',0,null,1,'{"shoes":"#f59e0b"}'::jsonb,43),
('shoes_white','shoes','White',0,null,1,'{"shoes":"#f1f3f5"}'::jsonb,44),
('shoes_red','shoes','Red',40,null,1,'{"shoes":"#e03131"}'::jsonb,45),
('shoes_black','shoes','Black',40,null,1,'{"shoes":"#212529"}'::jsonb,46),
('shoes_gold','shoes','Gold',150,null,1,'{"shoes":"#fcc419"}'::jsonb,47),
('pack_none','backpack','No backpack',0,null,1,'{"backpack":"none","packColor":"#f4b400"}'::jsonb,48),
('pack_yellow','backpack','Yellow backpack',0,null,1,'{"backpack":"pack","packColor":"#f4b400"}'::jsonb,49),
('pack_red','backpack','Red backpack',60,null,2,'{"backpack":"pack","packColor":"#e03131"}'::jsonb,50),
('pack_wings','backpack','Angel wings',null,5,6,'{"backpack":"wings","packColor":"#ffffff"}'::jsonb,51),
('acc_none','accessory','None',0,null,1,'{"accessory":"none","accColor":"#000000"}'::jsonb,52),
('acc_glasses','accessory','Round glasses',70,null,2,'{"accessory":"glasses","accColor":"#212529"}'::jsonb,53),
('acc_scarf','accessory','Red scarf',90,null,3,'{"accessory":"scarf","accColor":"#e03131"}'::jsonb,54),
('acc_phones','accessory','Headphones',120,null,4,'{"accessory":"headphones","accColor":"#212529"}'::jsonb,55),
('acc_cape','accessory','Hero cape',null,4,7,'{"accessory":"cape","accColor":"#e03131"}'::jsonb,56)
on conflict (key) do nothing;

-- ------------------------------------------------------------ seed data
insert into public.mq_items (key, name, kind, description, price_coins, price_gems, catch_multiplier, color, sort, effect) values
  ('potion', 'Potion', 'potion', 'Heals 40 HP during a battle.', 30, null, 1, '#f06595', 10, 40),
  ('super_potion', 'Super Potion', 'potion', 'Heals 100 HP during a battle.', 80, null, 1, '#e64980', 11, 100),
  ('xp_candy', 'XP Candy', 'booster', 'Gives a monster 40 XP.', 40, null, 1, '#fab005', 20, 40),
  ('big_xp_candy', 'Big XP Candy', 'booster', 'Gives a monster 150 XP.', 130, null, 1, '#f59f00', 21, 150),
  ('evolution_stone', 'Evolution Stone', 'stone', 'Makes certain monsters evolve.', null, 8, 1, '#7048e8', 30, 0)
on conflict (key) do nothing;

insert into public.mq_missions (key, title, period, kind, target, reward_coins, reward_gems, sort) values
  ('d_answer10', 'Answer 10 questions correctly', 'daily', 'answer', 10, 30, 0, 1),
  ('d_capture1', 'Capture a monster', 'daily', 'capture', 1, 40, 0, 2),
  ('d_battle1', 'Win a battle', 'daily', 'battle', 1, 50, 0, 3),
  ('d_train1', 'Finish a training session', 'daily', 'train', 1, 25, 0, 4),
  ('w_capture7', 'Capture 7 monsters', 'weekly', 'capture', 7, 100, 3, 1),
  ('w_battle5', 'Win 5 battles', 'weekly', 'battle', 5, 120, 3, 2),
  ('w_answer100', 'Answer 100 questions correctly', 'weekly', 'answer', 100, 150, 2, 3),
  ('w_train5', 'Finish 5 training sessions', 'weekly', 'train', 5, 100, 1, 4),
  ('w_evolve1', 'Evolve a monster', 'weekly', 'evolve', 1, 80, 2, 5)
on conflict (key) do nothing;

insert into public.mq_type_chart (attacker, defender, mult) values
  ('fire','grass',2),
  ('fire','ice',2),
  ('fire','crystal',2),
  ('fire','water',0.5),
  ('fire','earth',0.5),
  ('fire','fire',0.5),
  ('water','fire',2),
  ('water','earth',2),
  ('water','grass',0.5),
  ('water','electric',0.5),
  ('water','water',0.5),
  ('grass','water',2),
  ('grass','earth',2),
  ('grass','fire',0.5),
  ('grass','ice',0.5),
  ('grass','air',0.5),
  ('grass','grass',0.5),
  ('electric','water',2),
  ('electric','air',2),
  ('electric','earth',0.5),
  ('electric','grass',0.5),
  ('electric','electric',0.5),
  ('earth','fire',2),
  ('earth','electric',2),
  ('earth','crystal',2),
  ('earth','grass',0.5),
  ('earth','air',0.5),
  ('earth','water',0.5),
  ('ice','grass',2),
  ('ice','air',2),
  ('ice','earth',2),
  ('ice','fire',0.5),
  ('ice','ice',0.5),
  ('ice','water',0.5),
  ('air','grass',2),
  ('air','shadow',0.5),
  ('air','electric',0.5),
  ('air','earth',2),
  ('air','crystal',0.5),
  ('shadow','light',2),
  ('shadow','air',2),
  ('shadow','shadow',0.5),
  ('shadow','crystal',0.5),
  ('light','shadow',2),
  ('light','ice',2),
  ('light','light',0.5),
  ('light','crystal',0.5),
  ('crystal','air',2),
  ('crystal','shadow',2),
  ('crystal','light',2),
  ('crystal','fire',0.5),
  ('crystal','earth',0.5),
  ('crystal','crystal',0.5)
on conflict (attacker, defender) do update set mult = excluded.mult;

-- ------------------------------------------------------------- helpers
create or replace function public.mq_mon_threshold(p_level int)
returns int language sql immutable as $$ select 20 + p_level * 10; $$;

create or replace function public.mq_add_monster_xp(p_monster uuid, p_amount int)
returns jsonb language plpgsql security definer set search_path = public as $$
declare m public.mq_player_monsters; lv int; x int; gained int := 0;
begin
  select * into m from public.mq_player_monsters where id = p_monster for update;
  if m.id is null then return null; end if;
  lv := m.level; x := m.xp + greatest(p_amount, 0);
  while lv < 50 and x >= public.mq_mon_threshold(lv) loop
    x := x - public.mq_mon_threshold(lv); lv := lv + 1; gained := gained + 1;
  end loop;
  if lv >= 50 then x := 0; end if;
  update public.mq_player_monsters set level = lv, xp = x, hp = hp + gained * 4, attack = attack + gained * 2,
    defense = defense + gained * 2, speed = speed + gained * 2 where id = p_monster;
  return jsonb_build_object('level', lv, 'xp', x, 'levels_gained', gained, 'next', public.mq_mon_threshold(lv));
end;
$$;

create or replace function public.mq_bump(p_user uuid, p_kind text, p_n int default 1)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.mq_player_missions (user_id, mission_key, period_start, progress)
  select p_user, k.key, case k.period when 'weekly' then date_trunc('week', now())::date else current_date end, least(k.target, p_n)
  from public.mq_missions k where k.active and k.kind = p_kind
  on conflict (user_id, mission_key, period_start) do update
    set progress = least((select target from public.mq_missions where key = excluded.mission_key), public.mq_player_missions.progress + p_n);
end;
$$;

create or replace function public.mq_trg_capture()
returns trigger language plpgsql security definer set search_path = public as $$
begin perform public.mq_bump(new.user_id, 'capture', 1); return new; end;
$$;
drop trigger if exists mq_capture_bump on public.mq_player_monsters;
create trigger mq_capture_bump after insert on public.mq_player_monsters for each row execute function public.mq_trg_capture();

create or replace function public.mq_type_mult(a text, d text)
returns numeric language sql stable security definer set search_path = public as $$
  select coalesce((select mult from public.mq_type_chart where attacker = a and defender = d), 1);
$$;

create or replace function public.mq_damage(p_level int, p_power int, p_atk int, p_def int, p_mult numeric, p_crit boolean, p_defending boolean)
returns int language sql volatile as $$
  select greatest(1, floor((floor(((2.0 * p_level / 5 + 2) * p_power * p_atk / greatest(p_def, 1)) / 50) + 2) * p_mult
         * (0.85 + random() * 0.15) * (case when p_crit then 1.5 else 1 end) * (case when p_defending then 0.5 else 1 end))::int);
$$;

-- ----------------------------------------------------- player state (v2)
create or replace function public.mq_state()
returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); p public.mq_players; xp int;
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
    'correct_total', p.correct_total, 'wrong_total', p.wrong_total, 'battles_won', p.battles_won, 'battles_lost', p.battles_lost,
    'xp_today', mq_xp_today(uid), 'xp_daily_cap', mq_cfg('daily_xp_cap', 400)::int, 'outfit', p.outfit,
    'inventory', coalesce((select jsonb_object_agg(item_key, qty) from public.mq_inventory where user_id = uid), '{}'::jsonb));
end;
$$;

-- ------------------------------------- questions (v2: training sessions)
create or replace function public.mq_next_question(p_encounter uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  e public.mq_encounters; s public.mq_species; z public.mq_zones; q public.mq_questions; d int; lo int; hi int;
begin
  select * into e from public.mq_encounters where id = p_encounter and user_id = uid;
  if e.id is null or e.status <> 'active' then raise exception 'this encounter is over'; end if;
  select * into s from public.mq_species where id = e.species_id;
  if e.kind = 'train' then
    d := least(5, 1 + e.level / 8);
  else
    select * into z from public.mq_zones where id = e.zone_id;
    d := least(5, greatest(1, round((s.capture_difficulty + coalesce(z.difficulty, 1)) / 2.0)::int));
  end if;
  lo := greatest(1, d - 1); hi := least(5, d + 1);
  select * into q from public.mq_questions where active and difficulty between lo and hi and not (id = any(e.asked)) order by random() limit 1;
  if q.id is null then select * into q from public.mq_questions where active and difficulty between lo and hi order by random() limit 1; end if;
  if q.id is null then select * into q from public.mq_questions where active order by random() limit 1; end if;
  if q.id is null then raise exception 'the question bank is empty'; end if;
  update public.mq_encounters set current_question_id = q.id, current_started_at = now(),
         asked = (array_append(asked, q.id))[greatest(1, cardinality(asked) - 18):] where id = e.id;
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
  finished boolean := false; mres jsonb := null; mxp int := 0; total_q int := mq_cfg('train_questions', 5)::int;
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
    if e.kind = 'train' then
      mxp := 8 + q.difficulty * 2 + least(new_streak - 1, 3);
      mres := mq_add_monster_xp(e.monster_id, mxp);
      update public.mq_encounters set correct_count = correct_count + 1, streak = new_streak,
        xp_earned = xp_earned + xp_gain, coins_earned = coins_earned + coin_gain, current_question_id = null
        where id = e.id returning * into e;
    else
      update public.mq_encounters set correct_count = correct_count + 1, streak = new_streak,
        meter = least(100, meter + gain_meter), xp_earned = xp_earned + xp_gain, coins_earned = coins_earned + coin_gain,
        current_question_id = null where id = e.id returning * into e;
    end if;
    update public.mq_players set coins = coins + coin_gain, correct_total = correct_total + 1 where user_id = uid;
    if xp_gain > 0 then update public.profiles set total_xp = total_xp + xp_gain where id = uid; end if;
    perform mq_bump(uid, 'answer', 1);
  else
    if e.kind = 'train' then
      update public.mq_encounters set wrong_count = wrong_count + 1, streak = 0, current_question_id = null where id = e.id returning * into e;
    else
      update public.mq_encounters set wrong_count = wrong_count + 1, streak = 0,
        meter = greatest(0, meter - mq_cfg('meter_loss_wrong', 10)::int), current_question_id = null
        where id = e.id returning * into e;
      if e.wrong_count >= max_wrong then
        fled := true;
        update public.mq_encounters set status = 'escaped', ended_at = now() where id = e.id;
      end if;
    end if;
    update public.mq_players set wrong_total = wrong_total + 1 where user_id = uid;
  end if;

  insert into public.mq_answers (user_id, encounter_id, question_id, correct, xp_awarded, response_ms)
  values (uid, e.id, q.id, ok, xp_gain, ms);

  if e.kind = 'train' and (e.correct_count + e.wrong_count) >= total_q then
    finished := true;
    update public.mq_encounters set status = 'done', ended_at = now() where id = e.id;
    perform mq_bump(uid, 'train', 1);
  end if;
  if fled or finished then
    insert into public.game_results (game_key, student_id, student_name, xp_earned, accuracy, duration_seconds, content_set_title)
    select 'monster-quest', uid, display_name, e.xp_earned, round(100.0 * e.correct_count / greatest(1, e.correct_count + e.wrong_count))::int,
           (extract(epoch from (now() - e.created_at)))::int, case when e.kind = 'train' then 'Monster Quest: training' else 'Monster Quest' end
    from public.profiles where id = uid;
  end if;

  return jsonb_build_object(
    'correct', ok, 'late', late, 'explanation', q.explanation, 'correct_answer', q.answer,
    'xp', xp_gain, 'coins', coin_gain, 'meter', e.meter, 'streak', e.streak,
    'correct_count', e.correct_count, 'wrong_count', e.wrong_count, 'required_correct', e.required_correct,
    'can_throw', (not fled) and e.kind = 'wild' and e.correct_count >= e.required_correct, 'escaped', fled,
    'monster_xp', mxp, 'monster', mres, 'finished', finished, 'total_questions', total_q);
end;
$$;

create or replace function public.mq_train_start(p_monster uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); m public.mq_player_monsters; e public.mq_encounters; n int;
begin
  select * into m from public.mq_player_monsters where id = p_monster and user_id = uid;
  if m.id is null then raise exception 'that monster is not yours'; end if;
  select count(*) into n from public.mq_encounters where user_id = uid and kind = 'train' and created_at >= date_trunc('day', now());
  if n >= mq_cfg('train_daily_sessions', 15) then raise exception 'You have trained enough for today. Come back tomorrow!'; end if;
  update public.mq_encounters set status = 'fled', ended_at = now() where user_id = uid and status = 'active';
  insert into public.mq_encounters (user_id, zone_id, species_id, level, required_correct, kind, monster_id)
  values (uid, 'dojo', m.species_id, m.level, mq_cfg('train_questions', 5)::int, 'train', m.id) returning * into e;
  return jsonb_build_object('id', e.id, 'monster_id', m.id, 'total_questions', e.required_correct);
end;
$$;

create or replace function public.mq_evolve(p_monster uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); m public.mq_player_monsters; s public.mq_species; t public.mq_species; have int; iname text;
begin
  select * into m from public.mq_player_monsters where id = p_monster and user_id = uid for update;
  if m.id is null then raise exception 'that monster is not yours'; end if;
  select * into s from public.mq_species where id = m.species_id;
  if s.evolves_to is null then raise exception '% cannot evolve', s.name; end if;
  select * into t from public.mq_species where id = s.evolves_to;
  if s.evolve_level is not null and m.level < s.evolve_level then raise exception '% must reach level % first', coalesce(m.nickname, s.name), s.evolve_level; end if;
  if s.evolve_item is not null then
    select qty into have from public.mq_inventory where user_id = uid and item_key = s.evolve_item for update;
    if coalesce(have, 0) < 1 then
      select name into iname from public.mq_items where key = s.evolve_item;
      raise exception 'You need 1 %', coalesce(iname, s.evolve_item);
    end if;
    update public.mq_inventory set qty = qty - 1 where user_id = uid and item_key = s.evolve_item;
  end if;
  update public.mq_player_monsters set species_id = t.id, hp = hp + (t.base_hp - s.base_hp), attack = attack + (t.base_attack - s.base_attack),
    defense = defense + (t.base_defense - s.base_defense), speed = speed + (t.base_speed - s.base_speed) where id = m.id;
  perform mq_bump(uid, 'evolve', 1);
  return jsonb_build_object('from', s.id, 'to', t.id, 'monster_id', m.id);
end;
$$;

create or replace function public.mq_use_item(p_item text, p_monster uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); it public.mq_items; have int; m public.mq_player_monsters;
begin
  select * into it from public.mq_items where key = p_item and kind = 'booster' and active;
  if it.key is null then raise exception 'that item cannot be used here'; end if;
  select * into m from public.mq_player_monsters where id = p_monster and user_id = uid;
  if m.id is null then raise exception 'that monster is not yours'; end if;
  select qty into have from public.mq_inventory where user_id = uid and item_key = it.key for update;
  if coalesce(have, 0) < 1 then raise exception 'you do not have any %', it.name; end if;
  update public.mq_inventory set qty = qty - 1 where user_id = uid and item_key = it.key;
  return public.mq_add_monster_xp(m.id, it.effect);
end;
$$;

-- ---------------------------------------------------------- wardrobe
create or replace function public.mq_cosmetic_usable(p_user uuid, c public.mq_cosmetics)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.mq_player_cosmetics where user_id = p_user and cosmetic_key = c.key)
      or (coalesce(c.price_coins, 1) = 0 and c.price_gems is null);
$$;

create or replace function public.mq_buy_cosmetic(p_key text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); c public.mq_cosmetics; p public.mq_players; xp int;
begin
  select * into c from public.mq_cosmetics where key = p_key and active;
  if c.key is null then raise exception 'unknown item'; end if;
  if mq_cosmetic_usable(uid, c) then raise exception 'you already own this'; end if;
  select total_xp into xp from public.profiles where id = uid;
  if mq_level(coalesce(xp, 0)) < c.unlock_level then raise exception 'unlocks at trainer level %', c.unlock_level; end if;
  select * into p from public.mq_players where user_id = uid for update;
  if p.user_id is null then raise exception 'open Monster Quest first'; end if;
  if p.coins < coalesce(c.price_coins, 0) then raise exception 'not enough coins'; end if;
  if p.gems < coalesce(c.price_gems, 0) then raise exception 'not enough gems'; end if;
  update public.mq_players set coins = coins - coalesce(c.price_coins, 0), gems = gems - coalesce(c.price_gems, 0) where user_id = uid;
  insert into public.mq_player_cosmetics (user_id, cosmetic_key) values (uid, c.key) on conflict do nothing;
  return mq_state();
end;
$$;

create or replace function public.mq_equip(p_key text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); c public.mq_cosmetics;
begin
  select * into c from public.mq_cosmetics where key = p_key and active;
  if c.key is null then raise exception 'unknown item'; end if;
  if not mq_cosmetic_usable(uid, c) then raise exception 'you do not own this yet'; end if;
  update public.mq_players set outfit = outfit || jsonb_build_object(c.slot, c.key) where user_id = uid;
  return mq_state();
end;
$$;

-- ---------------------------------------------------------- missions
create or replace function public.mq_missions_list()
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('key', k.key, 'title', k.title, 'period', k.period, 'kind', k.kind, 'target', k.target,
    'progress', coalesce(pm.progress, 0), 'claimed', coalesce(pm.claimed, false), 'reward_coins', k.reward_coins, 'reward_gems', k.reward_gems)
    order by k.period, k.sort), '[]'::jsonb)
  from public.mq_missions k
  left join public.mq_player_missions pm on pm.user_id = auth.uid() and pm.mission_key = k.key
       and pm.period_start = case k.period when 'weekly' then date_trunc('week', now())::date else current_date end
  where k.active;
$$;

create or replace function public.mq_claim_mission(p_key text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); k public.mq_missions; pm public.mq_player_missions; ps date;
begin
  select * into k from public.mq_missions where key = p_key and active;
  if k.key is null then raise exception 'unknown mission'; end if;
  ps := case k.period when 'weekly' then date_trunc('week', now())::date else current_date end;
  select * into pm from public.mq_player_missions where user_id = uid and mission_key = p_key and period_start = ps for update;
  if pm.user_id is null or pm.progress < k.target then raise exception 'this mission is not finished yet'; end if;
  if pm.claimed then raise exception 'already claimed'; end if;
  update public.mq_player_missions set claimed = true where user_id = uid and mission_key = p_key and period_start = ps;
  update public.mq_players set coins = coins + k.reward_coins, gems = gems + k.reward_gems where user_id = uid;
  return mq_state();
end;
$$;

-- ------------------------------------------------ leaderboard (+ wins)
create or replace function public.mq_leaderboard(p_kind text)
returns table (rank int, user_id uuid, display_name text, value bigint, level int)
language sql stable security definer set search_path = public as $$
  with stats as (
    select p.id, p.display_name, p.total_xp, mp.battles_won,
           (select count(*) from public.mq_player_monsters m where m.user_id = p.id) as monsters,
           (select count(*) from public.mq_player_monsters m where m.user_id = p.id and m.captured_at > now() - interval '7 days') as weekly
    from public.profiles p join public.mq_players mp on mp.user_id = p.id)
  select (row_number() over (order by v desc, display_name))::int, id, display_name, v::bigint, mq_level(total_xp)
  from (select *, case p_kind when 'monsters' then monsters when 'weekly' then weekly when 'wins' then battles_won else total_xp end as v from stats) t
  where v > 0 order by v desc, display_name limit 25;
$$;

-- ======================================================= battle engine
create or replace function public.mq_bmon(p_id uuid, p_species text, p_name text, p_type text, p_level int, p_hp int, p_atk int, p_def int, p_spd int)
returns jsonb language sql immutable as $$
  select jsonb_build_object('id', p_id, 'species_id', p_species, 'name', p_name, 'type', p_type, 'level', p_level,
    'hp', p_hp, 'max', p_hp, 'atk', p_atk, 'def', p_def, 'spd', p_spd, 'fainted', false, 'used', false);
$$;

create or replace function public.mq_battle_view(b public.mq_battles, p_events jsonb)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare q public.mq_questions; pend jsonb := null;
begin
  if b.pending_question is not null then
    select * into q from public.mq_questions where id = b.pending_question;
    pend := public.mq_public_question(q);
  end if;
  return jsonb_build_object('id', b.id, 'status', b.status, 'opp_name', b.opp_name, 'difficulty', b.difficulty, 'zone_id', b.zone_id,
    'player', b.player, 'opp', b.opp, 'p_active', b.p_active, 'o_active', b.o_active, 'turn', b.turn,
    'pending', pend, 'result', b.result, 'events', coalesce(p_events, '[]'::jsonb));
end;
$$;

create or replace function public.mq_battle_start(p_zone text, p_difficulty text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid(); z public.mq_zones; xp int; team jsonb; opp jsonb := '[]'::jsonb; avgl numeric;
  n int; olvl int; sp public.mq_species; b public.mq_battles; i int;
  names text[] := array['Rival Rex','Trainer Mia','Explorer Omar','Ranger Lina','Captain Sam','Professor Zed','Scout Nora','Coach Pablo'];
begin
  if p_difficulty not in ('easy','normal','hard') then raise exception 'choose easy, normal or hard'; end if;
  select * into z from public.mq_zones where id = p_zone and active;
  if z.id is null then raise exception 'unknown arena'; end if;
  select total_xp into xp from public.profiles where id = uid;
  if mq_level(coalesce(xp, 0)) < z.unlock_level then raise exception 'this arena unlocks at level %', z.unlock_level; end if;
  select coalesce(jsonb_agg(public.mq_bmon(m.id, m.species_id, coalesce(m.nickname, s.name), s.type, m.level, m.hp, m.attack, m.defense, m.speed) order by m.team_slot), '[]'::jsonb)
    into team from public.mq_player_monsters m join public.mq_species s on s.id = m.species_id where m.user_id = uid and m.team_slot is not null;
  if jsonb_array_length(team) = 0 then raise exception 'Add at least one monster to your battle team first (My Monsters)'; end if;
  team := jsonb_set(team, '{0,used}', 'true'::jsonb);
  select avg((e ->> 'level')::int) into avgl from jsonb_array_elements(team) e;
  n := case p_difficulty when 'easy' then 1 when 'normal' then 2 else 3 end;
  olvl := greatest(3, round(avgl)::int + case p_difficulty when 'easy' then -1 when 'normal' then 0 else 2 end);
  for i in 1 .. n loop
    select * into sp from public.mq_species where active and (p_zone = any(zones) or (p_difficulty = 'hard' and stage >= 2)) order by random() limit 1;
    if sp.id is null then raise exception 'no opponents live in this arena yet'; end if;
    opp := opp || public.mq_bmon(null, sp.id, sp.name, sp.type, olvl, sp.base_hp + olvl * 4 + 3, sp.base_attack + olvl * 2 + 2, sp.base_defense + olvl * 2 + 2, sp.base_speed + olvl * 2 + 2);
  end loop;
  update public.mq_battles set status = 'forfeit', ended_at = now() where user_id = uid and status = 'active';
  insert into public.mq_battles (user_id, zone_id, difficulty, opp_name, player, opp)
  values (uid, p_zone, p_difficulty, names[1 + floor(random() * array_length(names, 1))::int], team, opp) returning * into b;
  return public.mq_battle_view(b, '[]'::jsonb);
end;
$$;

create or replace function public.mq_battle_state(p_battle uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare b public.mq_battles;
begin
  select * into b from public.mq_battles where id = p_battle and user_id = auth.uid();
  if b.id is null then raise exception 'battle not found'; end if;
  return public.mq_battle_view(b, '[]'::jsonb);
end;
$$;

create or replace function public.mq_battle_forfeit(p_battle uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare b public.mq_battles;
begin
  update public.mq_battles set status = 'forfeit', ended_at = now(), pending_question = null,
    result = jsonb_build_object('won', false, 'xp', 0, 'coins', 0, 'monster_xp', 0, 'levels', '[]'::jsonb, 'forfeit', true)
  where id = p_battle and user_id = auth.uid() and status = 'active' returning * into b;
  if b.id is null then raise exception 'this battle is over'; end if;
  return public.mq_battle_view(b, '[]'::jsonb);
end;
$$;

create or replace function public.mq_battle_act(p_battle uuid, p_action text, p_arg text default null, p_answer jsonb default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  b public.mq_battles; P jsonb; O jsonb; pa int; oa int; ev jsonb := '[]'::jsonb;
  q public.mq_questions; ms int; late boolean; special_ok boolean := false; d int; sxp int := 0;
  act text := p_action; psf boolean := true; phase int; pdef boolean := false; player_lost_turn boolean := false;
  ended text := null; power int; crit boolean; mult numeric; dmg int; newhp int; pm jsonb; om jsonb; idx int; i int; nxt int;
  it public.mq_items; have int; heal int;
  avgl numeric; dm numeric; coin_reward int; tx int; mx int; usedb int; lvls jsonb := '[]'::jsonb; mres jsonb; res jsonb;
begin
  select * into b from public.mq_battles where id = p_battle and user_id = uid for update;
  if b.id is null or b.status <> 'active' then raise exception 'this battle is over'; end if;
  P := b.player; O := b.opp; pa := b.p_active; oa := b.o_active;

  if b.pending_question is not null then
    if act = 'cancel' then
      update public.mq_battles set pending_question = null, pending_started_at = null where id = b.id returning * into b;
      return public.mq_battle_view(b, '[]'::jsonb);
    elsif act <> 'answer' then
      raise exception 'answer the question or cancel the special attack';
    end if;
  elsif act = 'answer' then raise exception 'no question is waiting';
  elsif act = 'cancel' then return public.mq_battle_view(b, '[]'::jsonb);
  end if;

  if act = 'special' then
    d := least(5, 1 + ((P -> pa ->> 'level')::int) / 7);
    select * into q from public.mq_questions where active and difficulty between greatest(1, d - 1) and least(5, d + 1) order by random() limit 1;
    if q.id is null then select * into q from public.mq_questions where active order by random() limit 1; end if;
    if q.id is null then raise exception 'the question bank is empty'; end if;
    update public.mq_battles set pending_question = q.id, pending_started_at = now() where id = b.id returning * into b;
    return public.mq_battle_view(b, '[]'::jsonb);
  end if;

  if act not in ('attack','defend','switch','item','answer') then raise exception 'unknown action'; end if;

  if act = 'switch' then
    idx := p_arg::int;
    if idx is null or idx < 0 or idx >= jsonb_array_length(P) or idx = pa or (P -> idx ->> 'fainted')::boolean then raise exception 'you cannot switch to that monster'; end if;
  elsif act = 'item' then
    select * into it from public.mq_items where key = p_arg and kind = 'potion' and active;
    if it.key is null then raise exception 'that item cannot be used in battle'; end if;
    select qty into have from public.mq_inventory where user_id = uid and item_key = it.key for update;
    if coalesce(have, 0) < 1 then raise exception 'you do not have any %', it.name; end if;
    if (P -> pa ->> 'hp')::int >= (P -> pa ->> 'max')::int then raise exception 'its HP is already full'; end if;
  elsif act = 'answer' then
    select * into q from public.mq_questions where id = b.pending_question;
    ms := (extract(epoch from (now() - b.pending_started_at)) * 1000)::int;
    late := q.time_limit_s is not null and ms > (q.time_limit_s + 6) * 1000;
    special_ok := (not late) and public.mq_check(q, p_answer);
    if special_ok then
      sxp := greatest(0, least(mq_cfg('special_xp', 3)::int, mq_cfg('daily_xp_cap', 400)::int - mq_xp_today(uid)));
    end if;
    insert into public.mq_answers (user_id, encounter_id, question_id, correct, xp_awarded, response_ms) values (uid, null, q.id, special_ok, sxp, ms);
    if special_ok then
      update public.mq_players set correct_total = correct_total + 1 where user_id = uid;
      if sxp > 0 then update public.profiles set total_xp = total_xp + sxp where id = uid; end if;
      perform public.mq_bump(uid, 'answer', 1);
    else
      update public.mq_players set wrong_total = wrong_total + 1 where user_id = uid;
    end if;
    ev := ev || jsonb_build_object('kind', 'quiz', 'side', 'player', 'correct', special_ok, 'late', late, 'explanation', q.explanation, 'answer', q.answer,
      'text', case when special_ok then 'Correct! The attack is supercharged!' when late then 'Too slow! The attack fizzles.' else 'Wrong answer! The attack is weak.' end);
  end if;

  if act in ('attack','answer') and (O -> oa ->> 'spd')::int > (P -> pa ->> 'spd')::int then psf := false; end if;

  for phase in 1 .. 2 loop
    exit when ended is not null;
    if (phase = 1) = psf then
      -- ------------------------------------------------ the player acts
      if player_lost_turn then continue; end if;
      pm := P -> pa; om := O -> oa;
      if act in ('attack','answer') then
        power := case when act = 'attack' then 45 when special_ok then 90 else 25 end;
        crit := (act = 'answer' and special_ok and random() < 0.5) or random() < 0.0625;
        mult := public.mq_type_mult(pm ->> 'type', om ->> 'type');
        dmg := public.mq_damage((pm ->> 'level')::int, power, (pm ->> 'atk')::int, (om ->> 'def')::int, mult, crit, false);
        newhp := greatest(0, (om ->> 'hp')::int - dmg);
        O := jsonb_set(O, array[oa::text, 'hp'], to_jsonb(newhp));
        ev := ev || jsonb_build_object('side', 'player', 'kind', case when act = 'answer' then 'special' else 'attack' end,
          'text', (pm ->> 'name') || case when act = 'answer' then ' unleashes a special attack!' else ' attacks!' end,
          'target', 'opp', 'idx', oa, 'dmg', dmg, 'hp_after', newhp, 'eff', case when mult > 1 then 'super' when mult < 1 then 'weak' end, 'crit', crit);
        if newhp = 0 then
          O := jsonb_set(O, array[oa::text, 'fainted'], 'true'::jsonb);
          ev := ev || jsonb_build_object('side', 'opp', 'kind', 'faint', 'text', (om ->> 'name') || ' fainted!', 'target', 'opp', 'idx', oa);
          nxt := null;
          for i in 0 .. jsonb_array_length(O) - 1 loop if not (O -> i ->> 'fainted')::boolean then nxt := i; exit; end if; end loop;
          if nxt is null then ended := 'won'; else
            oa := nxt;
            ev := ev || jsonb_build_object('side', 'opp', 'kind', 'info', 'text', b.opp_name || ' sends out ' || (O -> oa ->> 'name') || '!', 'target', 'opp', 'idx', oa);
          end if;
        end if;
      elsif act = 'defend' then
        pdef := true;
        ev := ev || jsonb_build_object('side', 'player', 'kind', 'defend', 'text', (pm ->> 'name') || ' braces for impact!');
      elsif act = 'switch' then
        pa := idx; P := jsonb_set(P, array[pa::text, 'used'], 'true'::jsonb);
        ev := ev || jsonb_build_object('side', 'player', 'kind', 'switch', 'text', 'Go, ' || (P -> pa ->> 'name') || '!', 'target', 'player', 'idx', pa);
      elsif act = 'item' then
        heal := it.effect;
        newhp := least((pm ->> 'max')::int, (pm ->> 'hp')::int + heal);
        P := jsonb_set(P, array[pa::text, 'hp'], to_jsonb(newhp));
        update public.mq_inventory set qty = qty - 1 where user_id = uid and item_key = it.key;
        ev := ev || jsonb_build_object('side', 'player', 'kind', 'item', 'text', (pm ->> 'name') || ' recovers ' || (newhp - (pm ->> 'hp')::int) || ' HP!',
          'target', 'player', 'idx', pa, 'hp_after', newhp, 'heal', newhp - (pm ->> 'hp')::int);
      end if;
    else
      -- --------------------------------------------- the opponent acts
      pm := P -> pa; om := O -> oa;
      power := case when random() < 0.25 then 80 else 45 end;
      crit := random() < 0.0625;
      mult := public.mq_type_mult(om ->> 'type', pm ->> 'type');
      dmg := public.mq_damage((om ->> 'level')::int, power, (om ->> 'atk')::int, (pm ->> 'def')::int, mult, crit, pdef);
      newhp := greatest(0, (pm ->> 'hp')::int - dmg);
      P := jsonb_set(P, array[pa::text, 'hp'], to_jsonb(newhp));
      ev := ev || jsonb_build_object('side', 'opp', 'kind', case when power = 80 then 'special' else 'attack' end,
        'text', (om ->> 'name') || case when power = 80 then ' uses a strong attack!' else ' attacks!' end,
        'target', 'player', 'idx', pa, 'dmg', dmg, 'hp_after', newhp, 'eff', case when mult > 1 then 'super' when mult < 1 then 'weak' end, 'crit', crit, 'blocked', pdef);
      if newhp = 0 then
        P := jsonb_set(P, array[pa::text, 'fainted'], 'true'::jsonb);
        ev := ev || jsonb_build_object('side', 'player', 'kind', 'faint', 'text', (pm ->> 'name') || ' fainted!', 'target', 'player', 'idx', pa);
        nxt := null;
        for i in 0 .. jsonb_array_length(P) - 1 loop if not (P -> i ->> 'fainted')::boolean then nxt := i; exit; end if; end loop;
        if nxt is null then ended := 'lost'; else
          pa := nxt; player_lost_turn := true; P := jsonb_set(P, array[pa::text, 'used'], 'true'::jsonb);
          ev := ev || jsonb_build_object('side', 'player', 'kind', 'info', 'text', 'Go, ' || (P -> pa ->> 'name') || '!', 'target', 'player', 'idx', pa);
        end if;
      end if;
    end if;
  end loop;

  if ended is null then
    update public.mq_battles set player = P, opp = O, p_active = pa, o_active = oa, turn = turn + 1, pending_question = null, pending_started_at = null
      where id = b.id returning * into b;
    return public.mq_battle_view(b, ev);
  end if;

  -- ------------------------------------------------------- battle over
  select avg((e ->> 'level')::int) into avgl from jsonb_array_elements(O) e;
  dm := case b.difficulty when 'easy' then 1 when 'normal' then 1.5 else 2.2 end;
  if ended = 'won' then
    coin_reward := round((20 + avgl * 2) * dm)::int; tx := round((10 + avgl) * dm)::int; mx := round((15 + avgl) * dm)::int;
  else coin_reward := 5; tx := 0; mx := 5; end if;
  select coalesce(sum((result ->> 'xp')::int), 0) into usedb from public.mq_battles where user_id = uid and created_at >= date_trunc('day', now()) and id <> b.id;
  tx := greatest(0, least(tx, mq_cfg('battle_daily_xp_cap', 250)::int - usedb));
  for i in 0 .. jsonb_array_length(P) - 1 loop
    if (P -> i ->> 'used')::boolean then
      mres := public.mq_add_monster_xp((P -> i ->> 'id')::uuid, mx);
      if mres is not null then lvls := lvls || jsonb_build_object('id', P -> i ->> 'id', 'name', P -> i ->> 'name', 'level', mres -> 'level', 'levels_gained', mres -> 'levels_gained'); end if;
    end if;
  end loop;
  update public.mq_players set coins = mq_players.coins + coin_reward, battles_won = battles_won + (case when ended = 'won' then 1 else 0 end),
    battles_lost = battles_lost + (case when ended = 'lost' then 1 else 0 end) where user_id = uid;
  if tx > 0 then update public.profiles set total_xp = total_xp + tx where id = uid; end if;
  res := jsonb_build_object('won', ended = 'won', 'xp', tx, 'coins', coin_reward, 'monster_xp', mx, 'levels', lvls);
  insert into public.game_results (game_key, student_id, student_name, xp_earned, accuracy, duration_seconds, content_set_title)
  select 'monster-quest', uid, display_name, tx, case when ended = 'won' then 100 else 0 end, (extract(epoch from (now() - b.created_at)))::int, 'Monster Quest: battle' from public.profiles where id = uid;
  if ended = 'won' then perform public.mq_bump(uid, 'battle', 1); end if;
  update public.mq_battles set player = P, opp = O, p_active = pa, o_active = oa, turn = turn + 1, pending_question = null, pending_started_at = null,
    status = ended, result = res, ended_at = now() where id = b.id returning * into b;
  return public.mq_battle_view(b, ev);
end;
$$;

grant execute on all functions in schema public to authenticated;
