# Explorer prompts (match the new monsters)

Generate **one sheet per explorer** with your image generator (ChatGPT image, Midjourney, Gemini, etc.), then cut it with
`python3 tools/slice_character_sheet.py sheet.png <id>`. Use the ids below so the files replace the old ones:

| id | name | idea |
|---|---|---|
| boy | Rusty | boy explorer with a backpack |
| elf | Fern | forest archer |
| scout | Skye | sunny scout |
| sage | Willow | silver ranger |
| troll | Bramble | flower-basket troll |
| fairy | Twinkle | star-wand fairy |
| dwarf | Cogsworth | gear-pack tinkerer |

Tip: generate Rusty first. Once you like him, upload that image with every other prompt and add
"Use the exact same art style, proportions, line weight and lighting as the attached image."

---

## 1. Master prompt (copy this, then add ONE character block from section 2)

```
A character animation sheet of ONE chibi adventurer for a children's monster-collecting game, in the same style as a
set of glossy cute monster mascots: soft 3D-rendered toy look with clean cel shading, smooth rounded shapes, thick soft
dark-purple outlines, rich saturated colours, subtle rim light, light coming from the top left, gentle ambient shadows
inside the model only.

PROPORTIONS: chibi, about 2.2 heads tall. The head is large and round (roughly half of the total height). Big glossy
dark eyes with two white highlights, tiny nose, small friendly smile, rosy cheeks. Short rounded limbs, small hands and
boots. Friendly and brave, never scary, no weapons pointed at anyone. Outfit is simple with a few clear colours and one
or two small details (so it reads at 100 pixels tall). The head must be clearly separate from the body and must have no
hat or crown on it (the game adds hats later): bare hair only, keep the top of the head clean and rounded.

SHEET LAYOUT: exactly 3 columns x 3 rows on a perfectly flat pure magenta (#FF00FF) background, equal cell sizes,
the character the same size in every cell, centred, with the feet on the same baseline in every cell, nothing touching
the cell edges, no text, no labels, no grid lines, no shadows on the floor.
 Row 1: facing the camera. Column 1 standing, column 2 walking (left foot forward), column 3 walking (right foot forward).
 Row 2: facing RIGHT in side view. Column 1 standing, column 2 and 3 the two walking steps.
 Row 3: seen from BEHIND. Column 1 standing, column 2 and 3 the two walking steps.
Walk poses are subtle: small step, arms swing a little, body stays the same size.

Keep every detail (colours, clothes, hair, accessories) identical in all nine cells.
```

**Negative / avoid:** text, watermark, hat, crown, helmet, floor shadow, scenery, extra characters, realistic proportions,
photo, 2D flat vector, thin outlines, scary face, different outfit between cells, cropped feet.

---

## 2. Character blocks (paste after the master prompt)

**boy / Rusty**
```
CHARACTER: Rusty, a cheerful boy explorer. Messy short brown hair, big hazel eyes, freckles, red short-sleeve jacket over
a cream shirt, blue shorts, brown boots, a round green leaf-shaped backpack with brown straps (clearly visible from behind
and partly from the side).
```
**elf / Fern**
```
CHARACTER: Fern, a young forest elf archer. Bright leaf-green bob hair, long pointed ears, emerald eyes, olive-green tunic
with a brown belt and small gold leaf brooch, cream leggings, brown boots, a small wooden bow and a quiver on her back.
```
**scout / Skye**
```
CHARACTER: Skye, a sunny scout. Golden blond swept-back hair, sky-blue eyes, sky-blue zip jacket with a yellow collar,
tan shorts, white sneakers with blue stripes, a small yellow satchel across the body.
```
**sage / Willow**
```
CHARACTER: Willow, a calm silver ranger. Long silver-white hair with a small braid, soft violet eyes, slightly pointed
ears, forest-green hooded cloak (hood DOWN) over a brown vest, tall brown boots, a tiny wooden staff with a green gem.
```
**troll / Bramble**
```
CHARACTER: Bramble, a friendly blue troll. Sky-blue skin, round belly, big gentle yellow eyes, small tusks, tuft of
orange hair, brown patchwork vest, moss-green shorts, bare feet with big toes, a woven flower basket on his back full of
colourful flowers.
```
**fairy / Twinkle**
```
CHARACTER: Twinkle, a tiny star fairy. Long pink hair in two high pigtails with star clips, lilac eyes, lilac dress with a
white star pattern, small translucent sparkly wings (visible from behind and slightly from the side), pink ballet shoes,
holding a short star-tipped wand. Wings must be small and close to the body.
```
**dwarf / Cogsworth**
```
CHARACTER: Cogsworth, a cosy dwarf tinkerer. Big fluffy orange beard and moustache, round nose, tiny brown eyes, red
work shirt with brown suspenders, grey trousers, sturdy brown boots, brass gear-shaped backpack with a small wrench
and a pair of round brass goggles hanging around his neck (not on the face).
```

---

## 3. After generating

1. Check the 3x3 grid is even and the background is flat magenta. If the generator invents extra rows, ask it:
   "Redo this as exactly 3 columns by 3 rows, equal cells."
2. Save as `rusty-sheet.png` and run `python3 tools/slice_character_sheet.py rusty-sheet.png boy`
   (a white, green or transparent background also works).
3. The nine frames land in `public/monster-quest/players/boy/` (260x232, feet on line 222). Refresh the game.
4. Wardrobe props (hats, glasses, scarves, backpacks, capes, wings) measure each frame's head and fit themselves,
   so no extra setup. This is why the prompt asks for a bare, round head with no hat.
5. Names, blurbs and prices: `src/features/monsterQuest/world/characters.ts` (names/blurbs) and the `char_<id>` rows in
   `supabase/monster_quest_roster_patch.sql` (prices).
