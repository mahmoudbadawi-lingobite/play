# Monster Quest update: what changed and how to install

Copy the files in `src/`, `supabase/`, `tools/`, `docs/` into your project (same paths, overwriting), then run the SQL once.

## 1. Install order
1. **Supabase SQL editor:** run `supabase/monster_quest_roster_patch.sql` (safe to re-run).
2. Copy the `src/` files, `tools/` and `docs/` over the project and deploy.

## 2. New monsters (the 40 from your sheet)
* The SQL adds the 40 monsters with the sheet names (sprites and animations were already in the project and are identical to
  the ones you sent), links them to the right sprite files and gives each a type, rarity, stats, home zones and spawn weight.
* 10 evolutions: Flamora→Rexi, Drakko→Aero, Leafy→Flora, Slimo→Jellio, Pingu→Frosti, Owly→Skyro, Phantix→Shado,
  Zappy→Stormy (Evolution Stone), Turtle→Dinozy, Pixie→Starry.
* Every monster a player already owns is converted to the closest new one (level, XP, stats, team slots kept). Old monsters
  are hidden, not deleted. Battles in progress are ended.
* `MonsterArt.tsx` / `monsterSprites.ts`: the supplied animation now plays from the sprite name everywhere (encounters, collection, training, evolve).
* The sheet calls #11 "Turtle"; its file and animation are still `turtley`.

## 3. Explorers
* Prompts + cutter: `docs/EXPLORER_PROMPTS.md`, `tools/slice_character_sheet.py` (needs `pip install pillow`).
* Until you replace the art, the current explorer images keep working.

## 4. Bag and Shop keep full screen
* Bag, Shop (also the E key at the shop), Style, Monsters and Explorers now open as a panel on top of the paused world
  (`world/WorldPanel.tsx`). Full screen stays on and "← Back to game" (or Esc) returns to the exact same spot.
* After a capture, "My Monsters" opens the same panel instead of leaving the game.

## 5. First explorer free, others for coins
* On first entry the player picks one explorer (free, once, enforced by `mq_choose_character`).
* Profile → "My explorers": switch between owned ones free, buy others with coins (150–450).

## 6. Props for explorers
* Style tab now sells 14 props (hats, face, neck, back; 60–400 coins), try-on before buying, wear/take off, shown in the world,
  dashboard and profile. Props auto-fit any explorer art (`world/props.ts`).
* The old trainer-look items are switched off.

## Not tested
I could not run the SQL against a database or build the app here (no network). I checked TypeScript syntax and rendered the
props on your current explorers in a browser. Please run the SQL on a copy first if you can.
