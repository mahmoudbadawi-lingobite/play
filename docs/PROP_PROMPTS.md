# Props: prompts and how to add them

The explorers are the Treasure Hunt characters (chibi, big heads, warm hand-painted game-sprite look, dark brown outlines).
Props must be drawn in that style or they look pasted on. **Always attach a Treasure Hunt sheet** (for example
`public/treasure/chars/pink.png` and `redcap.png`) to the image request, so the generator copies the style.

Good to know: the explorers **already wear** a hat or cap (some have goggles, a flower wreath or a helmet) and a small backpack.
So design:
* **head** props to sit ON TOP of a hat or hair (crowns, halos, bows, party hat, star pins, leaf crown, small wizard hat, horns, antennae)
* **face** props (glasses, star shades, masks, moustache, clown nose)
* **neck** props (scarf, bandana, bow tie, medal, flower garland)
* **back** props that go BEHIND the character (wings, capes, jetpack, giant leaf, big shell, rainbow)

---

## 1. Prompt (one sheet per slot; copy, fill the two blanks)

```
Using the attached Treasure Hunt explorer sprite sheet as the exact style reference (same hand-painted game-sprite look,
same dark brown outlines, same soft cel shading, same saturated warm colours, light from top left), draw a sheet of
{N} separate dress-up ACCESSORIES for those chibi explorers. Accessory type: {SLOT TYPE AND IDEAS}.

LAYOUT: exactly {COLS} columns x {ROWS} rows, equal cells, on a perfectly flat pure magenta (#FF00FF) background. One
accessory per cell, centred, drawn alone (no character, no head, no body, no hands), with a clear margin from the cell
edges. Every accessory is drawn FRONT VIEW, symmetrical, flat on to the camera, as if it were already being worn. No
text, no labels, no shadows on the floor, no grid lines, no overlapping between cells.

SIZE: draw each accessory at the size it would have on a chibi child with a big round head (hats about as wide as the
head, glasses about three quarters of the head width, scarves wrap a neck, capes and wings are large and open).
Keep shapes bold and simple so they read at 60 pixels wide.
```

Fill in like this:

| slot | `{SLOT TYPE AND IDEAS}` |
|---|---|
| head | `head accessories worn on top of a hat: golden crown, flower wreath, party hat, tiny wizard hat, halo, big red bow, cat ears headband, leaf crown` |
| face | `face accessories: round glasses, star-shaped sunglasses, pirate eye patch, fake moustache, heart glasses, ski goggles, clown nose, masked hero eye mask` |
| neck | `neck accessories: red knitted scarf, blue bandana, bow tie, gold medal on ribbon, flower garland, bell collar, cape collar, rainbow scarf` |
| back | `back accessories seen from behind and spread flat: fairy wings, red hero cape, dragon wings, jetpack, giant leaf, turtle shell, angel wings, rainbow` |

**Avoid (put in the negative prompt or add "Do not draw ..."):** character, face, hands, text, watermark, floor shadow,
perspective or 3/4 angle, different art style from the attachment, thin outlines, realistic or photographic look.

---

## 2. Cut them and put them in the shop

1. Save the image, e.g. `hats-sheet.png` (4 columns x 2 rows). Re-generate if a cell is empty or two items touch.
2. From the project folder (needs `pip install pillow`), list the props **left to right, top to bottom**:
   ```
   python3 tools/slice_props.py hats-sheet.png --slot head --cols 4 --rows 2 \
       --names "gold-crown,flower-wreath,party-hat,wizard-hat,halo,red-bow,cat-ears,leaf-crown" \
       --titles "Golden Crown,Flower Wreath,Party Hat,Wizard Hat,Halo,Red Bow,Cat Ears,Leaf Crown" \
       --prices 400,150,60,200,300,70,120,90
   ```
   (`--titles` and `--prices` are optional. Defaults: head 100, face 80, neck 80, back 150 coins.)
3. It writes the trimmed PNGs to `public/monster-quest/props/`, updates `props.json` and creates `supabase/monster_quest_props.sql`.
4. Run `supabase/monster_quest_props.sql` in the Supabase SQL editor, deploy, refresh. The props are in Style.

**Adding more later:** repeat with a new sheet and new ids. Existing props stay. Same id again = picture replaced, price
and placement you tuned are kept. Change a price or name by editing `props.json`, then run `python3 tools/slice_props.py --rebuild`
and the SQL again. To remove a prop delete its line in `props.json`, `--rebuild`, run the SQL.

---

## 3. Making a prop sit right (props.json)

Each prop is placed automatically from the explorer's head (the game measures the top and width of the head in every frame).
If one looks off, add numbers to that prop's entry in `public/monster-quest/props/props.json` (no code, refresh the page):

```json
{ "id": "gold-crown", "name": "Golden Crown", "slot": "head", "file": "gold-crown.png", "price": 400, "ar": 1.1,
  "w": 0.9, "oy": 0.0 }
```

| field | meaning | typical change |
|---|---|---|
| `w` | prop width as a multiple of the head width (head 1.1, face 0.85, neck 0.7, back 1.5 by default) | bigger/smaller prop |
| `oy` | move down (+) or up (-), in head widths | `0.1` = a bit lower |
| `ox` | move right (+) or left (-) | rarely needed |
| `ay` | which part of the prop sits on the anchor line: 0 = its top edge, 1 = its bottom edge | hats: raise toward 1 so the prop sits deeper on the head |
| `at` | anchor line: `top` (top of head), `eyes`, `neck`, `back` | rarely |

Back props are drawn behind the explorer from the front and side, and in front when you walk away from the camera.
Test in Style: the preview has Front / Side / Back buttons.
