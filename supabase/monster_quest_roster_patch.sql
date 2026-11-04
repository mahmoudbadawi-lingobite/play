-- Monster Quest: new monster roster, explorers and props.
-- Run once in the Supabase SQL editor (safe to re-run). Needs monster_quest_patch.sql and monster_quest_phase2_patch.sql first.
--  1. Replaces every monster with the 40 supplied monsters (same names and artwork as the sheet).
--  2. Existing captured monsters are converted to the closest new monster (level, XP, stats and team slots are kept).
--  3. Adds explorers (pick one free, buy the rest) and wardrobe props, plus the server functions for them.
begin;

insert into public.mq_species (id,name,type,rarity,description,base_hp,base_attack,base_defense,base_speed,zones,spawn_weight,capture_difficulty,required_correct,art,sprite_url,stage,evolves_to,evolve_level,evolve_item,active) values
('flamora','Flamora','fire','common','A tiny fire lizard whose tail flame never goes out.',42,13,9,11,'{volcano,desert}',28,2,1,'{"body":"round","c1":"#ff922b","c2":"#e8590c","belly":"#ffe8cc","ears":"none","tail":"none","eyes":"cute","mark":"none","extra":"none"}'::jsonb,'monster-quest/sprites/flamora.png',1,'rexi',16,null,true),
('drakko','Drakko','air','uncommon','A young dragon learning to fly, one wobbly flap at a time.',43,12,9,18,'{jungle,city}',14,3,2,'{"body":"round","c1":"#9bd1ff","c2":"#5aa9ee","belly":"#ffffff","ears":"none","tail":"none","eyes":"cute","mark":"none","extra":"none"}'::jsonb,'monster-quest/sprites/drakko.png',1,'aero',18,null,true),
('leafy','Leafy','grass','common','A cheerful sprout that naps in the sunshine.',45,9,11,9,'{forest}',28,1,1,'{"body":"round","c1":"#69db7c","c2":"#2f9e44","belly":"#ebfbee","ears":"none","tail":"none","eyes":"cute","mark":"none","extra":"none"}'::jsonb,'monster-quest/sprites/leafy.png',1,'flora',12,null,true),
('furron','Furron','earth','common','A fluffy fox cub with an extra-soft tail.',44,10,14,6,'{forest}',28,1,1,'{"body":"round","c1":"#b08968","c2":"#7f5539","belly":"#e6ccb2","ears":"none","tail":"none","eyes":"cute","mark":"none","extra":"none"}'::jsonb,'monster-quest/sprites/furron.png',1,null,null,null,true),
('phantix','Phantix','shadow','uncommon','A purple flame spirit that flickers in the dark.',44,14,10,16,'{jungle,city}',14,3,2,'{"body":"round","c1":"#845ef7","c2":"#5f3dc4","belly":"#d0bfff","ears":"none","tail":"none","eyes":"cute","mark":"none","extra":"none"}'::jsonb,'monster-quest/sprites/phantix.png',1,'shado',16,null,true),
('pingu','Pingu','ice','common','Waddles everywhere and slides on its belly for fun.',43,9,12,10,'{snow}',28,2,1,'{"body":"round","c1":"#a5d8ff","c2":"#4dabf7","belly":"#f1f9ff","ears":"none","tail":"none","eyes":"cute","mark":"none","extra":"none"}'::jsonb,'monster-quest/sprites/pingu.png',1,'frosti',14,null,true),
('rockzor','Rockzor','earth','rare','A mossy rock giant that stomps when it is excited.',58,14,18,9,'{volcano}',5,4,3,'{"body":"round","c1":"#b08968","c2":"#7f5539","belly":"#e6ccb2","ears":"none","tail":"none","eyes":"cute","mark":"none","extra":"none"}'::jsonb,'monster-quest/sprites/rockzor.png',1,null,null,null,true),
('zappy','Zappy','electric','common','Crackles with static whenever it gets excited.',39,11,8,14,'{forest,city}',28,1,1,'{"body":"round","c1":"#ffd43b","c2":"#e67700","belly":"#fff9db","ears":"none","tail":"none","eyes":"cute","mark":"none","extra":"none"}'::jsonb,'monster-quest/sprites/zappy.png',1,'stormy',null,'evolution_stone',true),
('pixie','Pixie','light','common','A tiny fairy that flutters faster than the eye can follow.',43,10,10,11,'{forest}',28,1,1,'{"body":"round","c1":"#ffe066","c2":"#f59f00","belly":"#fff9db","ears":"none","tail":"none","eyes":"cute","mark":"none","extra":"none"}'::jsonb,'monster-quest/sprites/pixie.png',1,'starry',14,null,true),
('aero','Aero','air','rare','Glides on warm winds high above the mountains.',57,18,15,23,'{}',0,3,2,'{"body":"round","c1":"#9bd1ff","c2":"#5aa9ee","belly":"#ffffff","ears":"none","tail":"none","eyes":"cute","mark":"none","extra":"none"}'::jsonb,'monster-quest/sprites/aero.png',2,null,null,null,true),
('turtley','Turtle','grass','common','Hides in its shell whenever it feels shy.',45,9,11,9,'{jungle,ocean}',28,2,1,'{"body":"round","c1":"#69db7c","c2":"#2f9e44","belly":"#ebfbee","ears":"none","tail":"none","eyes":"cute","mark":"none","extra":"none"}'::jsonb,'monster-quest/sprites/turtley.png',1,'dinozy',14,null,true),
('wooly','Wooly','earth','common','A woolly little ram that hops like it is counting sheep.',44,10,14,6,'{forest,snow}',28,1,1,'{"body":"round","c1":"#b08968","c2":"#7f5539","belly":"#e6ccb2","ears":"none","tail":"none","eyes":"cute","mark":"none","extra":"none"}'::jsonb,'monster-quest/sprites/wooly.png',1,null,null,null,true),
('bugsy','Bugsy','earth','common','A ladybug scuttler that loves to race along walls.',44,10,14,6,'{desert,volcano}',28,2,1,'{"body":"round","c1":"#b08968","c2":"#7f5539","belly":"#e6ccb2","ears":"none","tail":"none","eyes":"cute","mark":"none","extra":"none"}'::jsonb,'monster-quest/sprites/bugsy.png',1,null,null,null,true),
('jellio','Jellio','water','uncommon','A wobbly blue jelly that bounces when it is happy.',60,16,16,15,'{}',0,3,2,'{"body":"round","c1":"#4dabf7","c2":"#1c7ed6","belly":"#d0ebff","ears":"none","tail":"none","eyes":"cute","mark":"none","extra":"none"}'::jsonb,'monster-quest/sprites/jellio.png',2,null,null,null,true),
('spiksy','Spiksy','crystal','common','A crystal-spiked hedgehog that rolls into a ball.',42,10,13,9,'{snow,crystal}',28,2,1,'{"body":"round","c1":"#66d9e8","c2":"#1098ad","belly":"#e3fafc","ears":"none","tail":"none","eyes":"cute","mark":"none","extra":"none"}'::jsonb,'monster-quest/sprites/spiksy.png',1,null,null,null,true),
('frosti','Frosti','ice','uncommon','Its fur glitters like fresh snow in the moonlight.',57,15,18,15,'{}',0,3,2,'{"body":"round","c1":"#a5d8ff","c2":"#4dabf7","belly":"#f1f9ff","ears":"none","tail":"none","eyes":"cute","mark":"none","extra":"none"}'::jsonb,'monster-quest/sprites/frosti.png',2,null,null,null,true),
('mysti','Mysti','crystal','uncommon','A mysterious gem-marked cat that pounces without a sound.',46,12,14,12,'{snow,crystal}',14,3,2,'{"body":"round","c1":"#66d9e8","c2":"#1098ad","belly":"#e3fafc","ears":"none","tail":"none","eyes":"cute","mark":"none","extra":"none"}'::jsonb,'monster-quest/sprites/mysti.png',1,null,null,null,true),
('foxy','Foxy','fire','uncommon','Curious and quick, it tilts its head at every sound.',46,15,10,14,'{desert,volcano}',14,3,2,'{"body":"round","c1":"#ff922b","c2":"#e8590c","belly":"#ffe8cc","ears":"none","tail":"none","eyes":"cute","mark":"none","extra":"none"}'::jsonb,'monster-quest/sprites/foxy.png',1,null,null,null,true),
('slimo','Slimo','water','common','A gooey blue blob that jiggles with every step.',46,10,10,10,'{ocean}',28,2,1,'{"body":"round","c1":"#4dabf7","c2":"#1c7ed6","belly":"#d0ebff","ears":"none","tail":"none","eyes":"cute","mark":"none","extra":"none"}'::jsonb,'monster-quest/sprites/slimo.png',1,'jellio',12,null,true),
('dinozy','Dinozy','grass','uncommon','A stompy shell-back dino with a big, friendly heart.',59,15,17,14,'{}',0,3,2,'{"body":"round","c1":"#69db7c","c2":"#2f9e44","belly":"#ebfbee","ears":"none","tail":"none","eyes":"cute","mark":"none","extra":"none"}'::jsonb,'monster-quest/sprites/dinozy.png',2,null,null,null,true),
('skyro','Skyro','air','rare','A brave eagle-lion that soars high and dives fast.',57,18,15,23,'{}',0,3,2,'{"body":"round","c1":"#9bd1ff","c2":"#5aa9ee","belly":"#ffffff","ears":"none","tail":"none","eyes":"cute","mark":"none","extra":"none"}'::jsonb,'monster-quest/sprites/skyro.png',2,null,null,null,true),
('twinss','Twinss','shadow','rare','A purple snake that sways to hypnotise the curious.',54,16,13,16,'{jungle}',5,4,3,'{"body":"round","c1":"#845ef7","c2":"#5f3dc4","belly":"#d0bfff","ears":"none","tail":"none","eyes":"cute","mark":"none","extra":"none"}'::jsonb,'monster-quest/sprites/twinss.png',1,null,null,null,true),
('rokki','Rokki','crystal','rare','Crystals grow on its back and glint when it rumbles.',56,14,17,12,'{crystal}',5,4,3,'{"body":"round","c1":"#66d9e8","c2":"#1098ad","belly":"#e3fafc","ears":"none","tail":"none","eyes":"cute","mark":"none","extra":"none"}'::jsonb,'monster-quest/sprites/rokki.png',1,null,null,null,true),
('puffy','Puffy','light','common','A pink fluffball that puffs up like a happy cloud.',43,10,10,11,'{snow,crystal}',28,2,1,'{"body":"round","c1":"#ffe066","c2":"#f59f00","belly":"#fff9db","ears":"none","tail":"none","eyes":"cute","mark":"none","extra":"none"}'::jsonb,'monster-quest/sprites/puffy.png',1,null,null,null,true),
('cacty','Cacty','grass','common','Prickly outside, cheerful inside, and always cheering.',45,9,11,9,'{desert}',28,2,1,'{"body":"round","c1":"#69db7c","c2":"#2f9e44","belly":"#ebfbee","ears":"none","tail":"none","eyes":"cute","mark":"none","extra":"none"}'::jsonb,'monster-quest/sprites/cacty.png',1,null,null,null,true),
('shado','Shado','shadow','rare','A hooded shadow that appears and vanishes in a blink.',58,20,16,21,'{}',0,3,2,'{"body":"round","c1":"#845ef7","c2":"#5f3dc4","belly":"#d0bfff","ears":"none","tail":"none","eyes":"cute","mark":"none","extra":"none"}'::jsonb,'monster-quest/sprites/shado.png',2,null,null,null,true),
('rexi','Rexi','fire','rare','Roars like a dinosaur, but only to say hello.',56,19,15,16,'{}',0,3,2,'{"body":"round","c1":"#ff922b","c2":"#e8590c","belly":"#ffe8cc","ears":"none","tail":"none","eyes":"cute","mark":"none","extra":"none"}'::jsonb,'monster-quest/sprites/rexi.png',2,null,null,null,true),
('aquos','Aquos','water','uncommon','A sleek sea serpent that swims in graceful waves.',50,12,11,13,'{ocean}',14,3,2,'{"body":"round","c1":"#4dabf7","c2":"#1c7ed6","belly":"#d0ebff","ears":"none","tail":"none","eyes":"cute","mark":"none","extra":"none"}'::jsonb,'monster-quest/sprites/aquos.png',1,null,null,null,true),
('flora','Flora','grass','uncommon','Blooms into a bright flower when it is happy.',59,15,17,14,'{}',0,3,2,'{"body":"round","c1":"#69db7c","c2":"#2f9e44","belly":"#ebfbee","ears":"none","tail":"none","eyes":"cute","mark":"none","extra":"none"}'::jsonb,'monster-quest/sprites/flora.png',2,null,null,null,true),
('vampi','Vampi','shadow','uncommon','A tiny purple bat that flutters about at dusk.',44,14,10,16,'{snow,crystal}',14,3,2,'{"body":"round","c1":"#845ef7","c2":"#5f3dc4","belly":"#d0bfff","ears":"none","tail":"none","eyes":"cute","mark":"none","extra":"none"}'::jsonb,'monster-quest/sprites/vampi.png',1,null,null,null,true),
('froggy','Froggy','water','common','Takes enormous hops and croaks with a deep, silly voice.',46,10,10,10,'{jungle,ocean}',28,2,1,'{"body":"round","c1":"#4dabf7","c2":"#1c7ed6","belly":"#d0ebff","ears":"none","tail":"none","eyes":"cute","mark":"none","extra":"none"}'::jsonb,'monster-quest/sprites/froggy.png',1,null,null,null,true),
('starry','Starry','light','rare','A smiling star that twinkles and spins when it is proud.',57,16,16,16,'{}',0,3,2,'{"body":"round","c1":"#ffe066","c2":"#f59f00","belly":"#fff9db","ears":"none","tail":"none","eyes":"cute","mark":"none","extra":"none"}'::jsonb,'monster-quest/sprites/starry.png',2,null,null,null,true),
('unicorny','Unicorny','light','legendary','A legendary unicorn whose mane shimmers like the sky.',86,19,18,17,'{crystal}',1,5,3,'{"body":"round","c1":"#ffe066","c2":"#f59f00","belly":"#fff9db","ears":"none","tail":"none","eyes":"cute","mark":"none","extra":"none"}'::jsonb,'monster-quest/sprites/unicorny.png',1,null,null,null,true),
('lavaro','Lavaro','fire','legendary','A molten golem that glows hotter the angrier it gets.',85,22,17,17,'{volcano}',1,5,3,'{"body":"round","c1":"#ff922b","c2":"#e8590c","belly":"#ffe8cc","ears":"none","tail":"none","eyes":"cute","mark":"none","extra":"none"}'::jsonb,'monster-quest/sprites/lavaro.png',1,null,null,null,true),
('buzzy','Buzzy','electric','common','An antenna-wiggling bug that hums when it hops.',39,11,8,14,'{forest,jungle,city}',28,1,1,'{"body":"round","c1":"#ffd43b","c2":"#e67700","belly":"#fff9db","ears":"none","tail":"none","eyes":"cute","mark":"none","extra":"none"}'::jsonb,'monster-quest/sprites/buzzy.png',1,null,null,null,true),
('owly','Owly','air','uncommon','A wise owl that swivels its head to see everything.',43,12,9,18,'{forest,crystal}',14,2,2,'{"body":"round","c1":"#9bd1ff","c2":"#5aa9ee","belly":"#ffffff","ears":"none","tail":"none","eyes":"cute","mark":"none","extra":"none"}'::jsonb,'monster-quest/sprites/owly.png',1,'skyro',16,null,true),
('sharki','Sharki','water','rare','A cheerful shark that darts in, snaps, and swims away.',60,14,14,13,'{ocean}',5,4,3,'{"body":"round","c1":"#4dabf7","c2":"#1c7ed6","belly":"#d0ebff","ears":"none","tail":"none","eyes":"cute","mark":"none","extra":"none"}'::jsonb,'monster-quest/sprites/sharki.png',1,null,null,null,true),
('stormy','Stormy','electric','rare','A moody little thundercloud that flashes when it sulks.',53,17,14,19,'{}',0,3,2,'{"body":"round","c1":"#ffd43b","c2":"#e67700","belly":"#fff9db","ears":"none","tail":"none","eyes":"cute","mark":"none","extra":"none"}'::jsonb,'monster-quest/sprites/stormy.png',2,null,null,null,true),
('crabby','Crabby','water','common','Sidesteps along the shore and pinches when annoyed.',46,10,10,10,'{ocean}',28,2,1,'{"body":"round","c1":"#4dabf7","c2":"#1c7ed6","belly":"#d0ebff","ears":"none","tail":"none","eyes":"cute","mark":"none","extra":"none"}'::jsonb,'monster-quest/sprites/crabby.png',1,null,null,null,true),
('zeezy','Zeezy','air','uncommon','A glassy-winged dragonfly that zigzags through the air.',43,12,9,18,'{desert,city}',14,3,2,'{"body":"round","c1":"#9bd1ff","c2":"#5aa9ee","belly":"#ffffff","ears":"none","tail":"none","eyes":"cute","mark":"none","extra":"none"}'::jsonb,'monster-quest/sprites/zeezy.png',1,null,null,null,true)
on conflict (id) do update set name=excluded.name, type=excluded.type, rarity=excluded.rarity, description=excluded.description,
  base_hp=excluded.base_hp, base_attack=excluded.base_attack, base_defense=excluded.base_defense, base_speed=excluded.base_speed,
  zones=excluded.zones, spawn_weight=excluded.spawn_weight, capture_difficulty=excluded.capture_difficulty, required_correct=excluded.required_correct,
  art=excluded.art, sprite_url=excluded.sprite_url, stage=excluded.stage, evolves_to=excluded.evolves_to, evolve_level=excluded.evolve_level,
  evolve_item=excluded.evolve_item, active=true;

-- old monster -> new monster
create temp table mq_species_map (old_id text primary key, new_id text not null) on commit drop;
insert into mq_species_map (old_id, new_id) values
('sproutle','leafy'),
('pebblin','furron'),
('puffwing','owly'),
('splashet','slimo'),
('emberkit','flamora'),
('zapling','zappy'),
('mosswyrm','dinozy'),
('dunepup','bugsy'),
('cactling','cacty'),
('scorchling','foxy'),
('sandwisp','zeezy'),
('sunscarab','pixie'),
('frostkit','pingu'),
('snowpuff','frosti'),
('duskbat','vampi'),
('crystalynx','mysti'),
('aurorix','unicorny'),
('vinecub','turtley'),
('beakling','drakko'),
('mangrovi','froggy'),
('shadowpaw','phantix'),
('orchidra','flora'),
('sunparrot','starry'),
('cindermouse','flamora'),
('lavaling','rockzor'),
('magmaw','rexi'),
('ashwisp','shado'),
('obsidrake','rockzor'),
('solaris','lavaro'),
('bubbleon','jellio'),
('shellsprout','crabby'),
('coralisk','aquos'),
('lumifin','puffy'),
('tideray','sharki'),
('leviathor','sharki'),
('geodin','rokki'),
('gleamole','wooly'),
('prismoth','pixie'),
('shardrake','spiksy'),
('nocturna','twinss'),
('diamantis','rokki'),
('sparkbot','buzzy'),
('gearling','bugsy'),
('neonyx','zappy'),
('binbandit','vampi'),
('windrunner','skyro'),
('voltking','stormy'),
('overclock','stormy'),
('leafmane','flora'),
('pebblord','rockzor'),
('gustwing','aero'),
('tidalon','aquos'),
('blazefox','foxy'),
('voltstorm','stormy'),
('glacierfang','frosti'),
('duneguard','bugsy'),
('nightwing','vampi'),
('bramblebeast','dinozy'),
('cinderlord','rexi'),
('aquarex','jellio'),
('geomancer','rokki'),
('sparkmech','buzzy');

update public.mq_player_monsters m set species_id = x.new_id from mq_species_map x where m.species_id = x.old_id;
update public.mq_encounters e set species_id = x.new_id from mq_species_map x where e.species_id = x.old_id;

-- battles in progress hold the old line-ups: end them
update public.mq_battles set status = 'forfeit', ended_at = now() where status = 'active';

-- retire the old monsters (kept in the table so nothing that points at them breaks)
update public.mq_species set active = false where id in (select old_id from mq_species_map);

-- ------------------------------------------------------------ explorers and props
insert into public.mq_cosmetics (key, slot, name, price_coins, price_gems, unlock_level, data, sort, active) values
('char_boy','character','Rusty',150,null,1,'{"char":"boy"}'::jsonb,200,true),
('char_elf','character','Fern',200,null,1,'{"char":"elf"}'::jsonb,201,true),
('char_scout','character','Skye',250,null,1,'{"char":"scout"}'::jsonb,202,true),
('char_sage','character','Willow',300,null,1,'{"char":"sage"}'::jsonb,203,true),
('char_troll','character','Bramble',350,null,1,'{"char":"troll"}'::jsonb,204,true),
('char_fairy','character','Twinkle',400,null,1,'{"char":"fairy"}'::jsonb,205,true),
('char_dwarf','character','Cogsworth',450,null,1,'{"char":"dwarf"}'::jsonb,206,true),
('prop_cap','prop_head','Explorer Cap',80,null,1,'{"prop":"cap"}'::jsonb,300,true),
('prop_party','prop_head','Party Hat',60,null,1,'{"prop":"party"}'::jsonb,301,true),
('prop_flowers','prop_head','Flower Crown',150,null,1,'{"prop":"flowers"}'::jsonb,302,true),
('prop_catears','prop_head','Cat Ears',120,null,1,'{"prop":"catears"}'::jsonb,303,true),
('prop_wizard','prop_head','Wizard Hat',200,null,1,'{"prop":"wizard"}'::jsonb,304,true),
('prop_crown','prop_head','Golden Crown',400,null,1,'{"prop":"crown"}'::jsonb,305,true),
('prop_glasses','prop_face','Round Glasses',70,null,1,'{"prop":"glasses"}'::jsonb,306,true),
('prop_stars','prop_face','Star Shades',140,null,1,'{"prop":"stars"}'::jsonb,307,true),
('prop_goggles','prop_face','Aviator Goggles',180,null,1,'{"prop":"goggles"}'::jsonb,308,true),
('prop_bowtie','prop_neck','Bow Tie',60,null,1,'{"prop":"bowtie"}'::jsonb,309,true),
('prop_scarf','prop_neck','Cozy Scarf',90,null,1,'{"prop":"scarf"}'::jsonb,310,true),
('prop_pack','prop_back','Leaf Backpack',100,null,1,'{"prop":"pack"}'::jsonb,311,true),
('prop_cape','prop_back','Red Cape',220,null,1,'{"prop":"cape"}'::jsonb,312,true),
('prop_wings','prop_back','Fairy Wings',300,null,1,'{"prop":"wings"}'::jsonb,313,true)
on conflict (key) do update set slot=excluded.slot, name=excluded.name, price_coins=excluded.price_coins, price_gems=excluded.price_gems,
  unlock_level=excluded.unlock_level, data=excluded.data, sort=excluded.sort, active=true;

-- the old trainer-look items are no longer shown in the game
update public.mq_cosmetics set active = false
  where slot in ('body','skin','haircolor','hairstyle','hat','top','pants','shoes','backpack','accessory');

-- first explorer is free, once per player. More are bought with mq_buy_cosmetic and worn with mq_equip.
create or replace function public.mq_choose_character(p_key text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); c public.mq_cosmetics;
begin
  if uid is null then raise exception 'sign in first'; end if;
  select * into c from public.mq_cosmetics where key = p_key and slot = 'character' and active;
  if c.key is null then raise exception 'unknown explorer'; end if;
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

-- take a prop off (props only)
create or replace function public.mq_unequip(p_slot text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid();
begin
  if p_slot not like 'prop\_%' then raise exception 'you can only take props off'; end if;
  update public.mq_players set outfit = outfit - p_slot where user_id = uid;
  return mq_state();
end;
$$;

grant execute on all functions in schema public to authenticated;
commit;
