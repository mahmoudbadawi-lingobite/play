# Update 5: the storybook world (Ember Village first)

Copy these files over the project (same paths). No SQL this time.

## What you will see in Ember Village
* New look built from your painted sprites: grass and dirt-path textures, cobblestone plaza, mushroom houses, market stall, lamps, fountain,
  fences, flowers, bushes, trees, a river with wooden bridges, and a forest along the north.
* Animation: trees, bushes, flowers and grass sway in the wind; the fountain, the campfire and the gate torches are animated;
  lamps and crystals glow.
* Monster hiding places: three tall-grass patches (south-east, south-west, north-east). Monsters peek out of the grass now and then when
  you walk near, and walking in the grass starts encounters.
* The old lava streams became a river, the ledge in the north became forest, and "Lava lookout" became "River lookout".

## What did not change
Other places (Mushroom Valley and the rest) keep their old drawn look until they are converted; the gates, quests, shop, signs and
chest work as before. The village guide is still the old drawn character (see docs/WORLD_ART_PROMPTS.md for villager art).

## Files
* `public/monster-quest/world/` the art (about 2.5 MB, loaded only when you enter a storybook place) and `world-assets.json`.
* `src/.../world/storybook/` new painter and object table (`SCALE` and `km()` in `story.ts` control size and placement of each object).
* `src/.../world/paintLocation.ts`, `paintProps.ts`, `types.ts`, `engine.ts` small hooks (sway, animation frames, peeking monsters).
* `src/.../world/locations/emberlands.ts` the new village layout.
* `tools/build_world_assets.py` and `docs/WORLD_ART_PROMPTS.md` to keep adding art.

## Not tested
I ran the new village in a headless browser (look, bake time about 0.2 s, animation, peeking monsters, an older place still working)
but not on a phone and not inside the full app. Object sizes are a first guess; tell me what looks too big or too small.
