# Monster Quest update 2: Treasure Hunt explorers, image props, team-error fix

Copy these files over the project (same paths) and run the two SQL files once, in this order:
1. `supabase/monster_quest_explorers_patch.sql`
2. `supabase/monster_quest_props.sql` (only changes anything after you add props with `tools/slice_props.py`)

You can delete from update 1: `tools/slice_character_sheet.py` and `docs/EXPLORER_PROMPTS.md` (no longer used).

## 1. Treasure Hunt explorers in Monster Quest
* The six Treasure Hunt explorers (Rawan, Nour, Mayar, Mohamed, Mariam, Robo) with all their walking frames (4 directions, 3 steps)
  replace the old explorers. Monster Quest reads the same sheets in `public/treasure/chars/`, so no images are copied or duplicated.
* First explorer is chosen free, once. Others are bought with coins in Profile > My explorers (150–450), and every explorer
  you buy is kept: switch between owned explorers any time for free.
* Players who had an old explorer get a new free first pick. (Old explorers are retired.)

## 2. Props
* Props are now PNG images in `public/monster-quest/props/` listed in `props.json`; the old drawn props are removed
  (coins spent on them are refunded by the SQL). The shop shows "coming soon" until you add props.
* `docs/PROP_PROMPTS.md`: the prompts for ChatGPT / an image model, and how to cut, price, tune and keep adding props.
  `tools/slice_props.py` does the cutting, `props.json` and the SQL for you.
* Props fit any explorer automatically (the head is measured from the artwork). Note the explorers already wear hats and backpacks,
  so the prompt asks for props that go on top of / behind them.

## 3. "those monsters are not yours"
That message came from the team list. When you press Add to team / Remove from team, the app sends your whole team to the
server, and the server refused it if even one monster in the list was not (or no longer) yours. The list on screen can be out of
date (for example the page was open on two devices, or a monster was changed while it was open), and the app did not reload
after the error, so it kept failing. It was not a sign that anything was broken or lost. Fixed twice:
* `monster_quest_explorers_patch.sql`: the server now ignores anything in the list that is not yours and saves the rest.
* `Collection.tsx`: the list is always reloaded after an action, even after an error, with a friendlier message.
This is my best diagnosis from the code (I cannot see your database); if it still appears after the fix, tell me which button you pressed.

## Not tested
I could not run the SQL or build the app here. I checked TypeScript syntax, tested the prop cutter end to end, and rendered the
fit logic on the real Treasure Hunt sheets in a browser (with placeholder shapes). Run the SQL on a copy first if you can.
