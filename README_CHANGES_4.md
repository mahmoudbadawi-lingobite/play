# Update 4: your six new characters with a smooth 6-frame walk

1. Copy these files over the project (same paths). This adds `public/monster-quest/chars/` (6 sprite sheets + `chars.json`).
2. Run `supabase/monster_quest_characters.sql` in the Supabase SQL editor.
   It adds Adam, Lina, Yousef, Sara, Zaid and Maya to the shop (150 to 400 coins; every player still picks one free).
   The previous Treasure Hunt explorers are retired, so anyone who had one picks a new free explorer next time they enter the world.
   Names and prices are in `chars.json`; rename them there, then run `python tools/build_character.py --rebuild` and the SQL again.

What changed in the game
* New walk: standing frame plus six walk frames in four directions, played according to distance walked, no sliding bounce.
* Props are placed from each explorer's head position (stored in `chars.json`) instead of measuring pixels, so they are stable and
  you can adjust one explorer's `head` numbers if needed.
* Dashboard, Profile and the game HUD show a head-and-shoulders portrait of your explorer.
* The explorer list now comes from `chars.json`: adding a character later needs no code change
  (`docs/CHARACTER_PROMPTS.md` has the prompts and the command; `tools/build_character.py` needs `pip install pillow numpy scipy`).
* `docs/PROP_PROMPTS.md` is updated for the new bare-headed explorers.

Not tested on a real phone or against your database. I ran the game engine with these characters in a headless browser
(standing and walking in all four directions, with props) and checked the sheets by eye.
