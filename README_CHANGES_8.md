# Update 8: Mushroom Valley in the storybook style, and storybook villagers

Copy these files over the project (same paths). No SQL.

## Mushroom Valley (new look, same layout and gameplay)
* Dusk mood: purple-teal ground from your MV-A tiles, glowing giant mushrooms, bluebells, ferns, crystals, mushroom lamps, fairy ring, vine arch,
  firefly jars, a treehouse and a stump house, a river with bridges and stepping-stone fords, two animated waterfalls, a raised mossy plateau with a cliff face.
* Animated: waterfalls, fireflies, glowing lamps and mushrooms; trees, ferns, bluebells and grass sway.
* Monster hiding places: the same tall-grass patches, now with monsters from the new roster peeking out of the grass.
* The old tiny drawn village guide is now your elder villager; the other NPCs use the gardener and shopkeeper.

## Under the hood
* `storybook/story.ts`: places now pick a **theme** (`village` or `valley`) with their own ground tiles, path, plaza, object mapping and colour tint.
  `LocationDef.theme` chooses it. New places only need a theme entry and a mapping function (`valleyKinds` is the example).
* `paintLocation.ts`, `paintProps.ts`, `types.ts`, `engine.ts`: plateau and ford painting, NPC art hook, new prop kinds.
* `tools/build_world_assets.py`: the shadow under objects is now a neutral soft shadow (it was dark magenta), only the flat magenta is keyed so glowing purple
  parts survive, `--glow` turns pink glow into warm glow, `ground --names` cuts ground sets with their own names.
* `public/monster-quest/world/`: all art as WebP (about 4 MB in total; a place loads only its own theme).

## Not tested
Run in a headless browser (bake about 0.4 s, look, animation, peeking, the village still correct) but not on a phone or in the full app.
Ancient Ember Ruins and Molten Caverns are still the old drawn look.
