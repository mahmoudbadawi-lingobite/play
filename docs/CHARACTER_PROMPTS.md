# Adding a new explorer

## 1. Prompts (one chat per character)
Use the lineup prompt only once to design your explorers, then for each chosen character:

**Turnaround** (attach the lineup image):
```
Make a turnaround of this exact character: front, side (facing right) and back views side by side on a flat pure magenta
(#FF00FF) background, same size, same ground line, standing relaxed, arms at the sides, feet together. Same style,
colours and proportions, same smooth tidy hair, head bare, back free, neck free. Crisp thin dark outline with NO glow,
NO coloured halo, NO shadow, NO gradient or texture in the background. No text.
```
**Walk sheet** (attach the turnaround):
```
Draw a WALK CYCLE sprite sheet of exactly this character: 6 columns x 4 rows, equal cells, flat pure magenta (#FF00FF)
background, no text, no shadows, no glow or coloured halo, no grid lines. Rows: 1 walking toward the camera, 2 walking
left (side view), 3 walking right (side view), 4 walking away. Columns are 6 frames of one smooth looping walk: 1 contact
(front foot lands), 2 down (body lowest), 3 passing (legs cross, body highest), 4 contact (other foot lands), 5 down,
6 passing. Arms swing opposite to the legs, the body bobs slightly, head size and outfit identical in all 24 frames.
Leave a clear margin between frames: every figure fully inside its own cell, nothing touching another figure.
Head bare, back free, neck free, as in the turnaround.
```
Tidy, smooth hair (bob, crop, ponytail, scarf) works best with props. Messy tufts make hats float.

## 2. Build it (needs `pip install pillow numpy scipy` once)
```
python tools/build_character.py --id adam --name Adam --blurb "Star-shirt explorer" --walk adam-walk.png --price 150
```
* `--id` lowercase letters/digits/dashes (it is the file name), `--price` coins (the first explorer a player picks is free).
* It finds each figure itself, removes the magenta and its edge, scales and aligns all 24 frames, adds a standing frame, and writes
  `public/monster-quest/chars/<id>.png`, updates `chars.json` and `supabase/monster_quest_characters.sql`.
  Check `tools/preview/<id>.png`.
* Then run `supabase/monster_quest_characters.sql` in the Supabase SQL editor and upload `public/monster-quest/chars/`.
* Change a name or price: edit `chars.json`, run `python tools/build_character.py --rebuild`, run the SQL again.
* If hats sit too high/low on one explorer, edit that explorer's `head` numbers in `chars.json`:
  `top` = y of the top of the head (in the 256-pixel frame), `w` = head width.
