# Update 13: Starry and Puffy face the right way, name plates on their own side, Zappy becomes Electro

Copy these files over the project (same paths), then run ONE small SQL file in the Supabase SQL editor: `supabase/monster_quest_rename_electro.sql`.

## 1. Starry and Puffy face their opponent
The game flips each monster so it looks at its opponent, using a short list of pictures whose artwork looks LEFT (it used to be Zappy, Unicorny,
Frosti). Starry and Puffy lean slightly left too, so on your side they turned away. They are in the list now.
* `world/monsterSprites.ts`: `LOOKS_LEFT`. If another monster ever turns away, add its file name (lower case) to that list.

## 2. Name plates on the side of their own monster
Your monster's plate (name, level, HP, team dots) is now bottom-left next to your monster; the opponent's plate is top-right under "Give up",
next to the opponent. On a phone held upright they are side by side at the top, yours on the left.
* `screens/Arena.tsx` (class `mq-bplate-opp` on the opponent's plate), `scene/arena.css` (two position rules).

## 3. Zappy is now called Electro
Only the displayed name changes (everywhere: battle, collection, dex, shop texts...). The internal id stays `zappy`, so captured monsters, teams,
sprites and animations keep working. Monsters a player gave a nickname keep it.
* `supabase/monster_quest_rename_electro.sql`: one `update`, safe to re-run.
* `supabase/monster_quest_roster_patch.sql`: your original roster file with the name changed, so re-running it later does not turn Electro back
  into Zappy. Replace your copy with it; you do NOT need to run it now.

## Tested
tsc clean, vite build clean, no new lint warnings. Automated tests: the mirroring rule for Starry, Puffy, Zappy, Unicorny, Frosti and four others
(your monster looks right, the opponent looks left), the CSS positions of both plates (desktop and phone), and the SQL on PostgreSQL 16
(rename works, re-running is safe, the corrected roster file keeps "Electro", other names untouched).
NOT tested: how the battle screen looks in a real browser. Please check one battle on a computer and, if you can, on a phone.
