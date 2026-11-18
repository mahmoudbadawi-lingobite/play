# Monster Quest: handoff notes (read this first)

## What is in this zip
Code (`src/`), world art tools (`tools/`), art prompt docs (`docs/`), the world asset manifest + the pictures the world needs
(`public/monster-quest/world`, `chars/chars.json + 2 explorers`, `props`), config files, and a few READMEs. NOT included: monster sprites,
arena pictures, menu UI pictures (not needed for world work). Run `npm install` first. Some non-world screens will show missing pictures: ignore.

## Already done (do not redo)
- Arena battle scene, painted menus (nav icons, logo, shop, arena menu, dashboard), in-game confirm dialog (`ConfirmDialog` in `ui.tsx`).
- World 1 Emberlands, all 4 locations in the painted storybook style: Ember Village (`theme: 'village'`), Mushroom Valley (`'valley'`),
  Ancient Ember Ruins (`'ember'`), Molten Caverns (`'ember-cave'`). Data: `world/locations/emberlands.ts`.
- World 2 Emerald Grove, 4 locations: Mossgate Village (`theme: 'grove'`), Whispering Woods, Lilypad Hollow (`'grove'`), Heartwood Hollow (`'grove-roots'`, carve). Data: `world/locations/grove.ts`
  (shared authoring helpers: `world/locations/helpers.ts`). Art is `gr-*`; lakes use `lake()` (closed `water` liquid); up/down bridges in grove themes use `bridgeUpDown()`.
  Encounter backdrops `grove` / `roots`. Heartwood's north portal to World 3 is sealed (`exit: 'locked'`); Molten Caverns' portal to Emerald Grove is still sealed too (World 2 is entered from the world map).
- Worlds 3 to 6 are only entries in `world/worlds.ts` with `locations: []`: nothing is built yet.

## How a location works
- `LocationDef` (`world/types.ts`): size, `mode: 'open'` (grass-like open map, edge props) or `'carve'` (walkable `floors` over a `base` such as lava/rock),
  `paths`, `liquids`, `bridges`, `zones` (encounter areas), `props`, `gates` (exits), `interactables` (signs, npcs, chests, plates...).
  Add `style: 'storybook'` and `theme: '<name>'` to get the painted look (otherwise the old procedural look is used).
- `world/storybook/story.ts` is the painted renderer: `SCALE` (sprite size table), `ANIM_K`, `THEMES` (ground textures, which sprites/anims to load,
  base/top/rim colours, edge rocks, path texture), per-theme `kinds` function mapping `PropDef.kind` to a sprite or animation (see `emberKinds`),
  `plateau()` (raised floors), `path()`, `liquid()` (water, plus `lavaPool`), `bridge()` (wood bridge, or flat stone `causeway` when `theme.causeway`),
  `zone()` (encounter patches) and `tuftSprites()` (rustling grass on encounter ground).
- `world/paintLocation.ts` bakes the map; `world/engine.ts` runs it (player, collision, interactables; draws plates).
- Encounter backdrop (painted scene behind a wild monster): `scene/EncounterScene.tsx` (`DEFS`), chosen in `world/WorldView.tsx` from `theme`.
- `world/collision.ts` / `props.ts` hold footprints (`fp`) per prop type.

## Asset pipeline (`tools/build_world_assets.py`, writes `public/monster-quest/world/*` and `world-assets.json`)
- `ground <sheet> --names a,b,c...` : 3x3 sheet of seamless tiles (reading order). `--keep a,b` skips the cross-fade for tiles that are already seamless.
- `sprites <sheet> --names ... [--dilate N]` : objects on flat magenta, in reading order. Check the object count matches (try `--dilate 8..14`).
- `anim <strip> --name x --frames 6 --fps 6` : one strip of 6 frames.
  **Lesson learned:** ChatGPT frames are NOT aligned. After cutting an animation, register the frames (cv2.phaseCorrelate on the lower half of each frame
  against the middle frame) and re-save, otherwise the object visibly shakes/drifts. Also convert any pink glow fringe to a warm glow, and remove
  pink edge pixels from sprites (see how `em-*` were fixed).
- Sprite size comes from `SCALE[id]` in `story.ts` (px at prop scale 1; the explorer is about 140 px tall).

## How to check a location on screen (do this every time)
Create a temporary `hx/` folder in the project root: `hx/main.ts` creates `new WorldEngine({canvas, host, mini:null, character:'adam', progress:{flags:[],visited:[],chests:[],seenTutorial:true,calm:true,character:'adam'}, reduced:false, cb:{...empty functions}})`
and calls `engine.load(locationId, entranceId)`; `hx/vite.config.ts` uses `root: hx`, `publicDir: ../public`, port 5199; Playwright (preinstalled Chromium) opens
`/index.html?loc=<id>&ent=<gate>`, waits for `window.ready`, calls `window.eng.debugTeleport(x, y)` and takes screenshots. Delete `hx/` before packaging.
Encounter backdrops can be checked by rendering `<EncounterScene kind="..."/>` in a plain React page.

## Rules
- Edit only Monster Quest files. Never touch other games.
- Deliver overlay zips (only changed/new files). Run `npx tsc -b` and `npx vite build` before delivering.
- Style: glossy hand-painted, thin dark outlines, same look as the existing worlds (use `public/monster-quest/world/sprites/mv-*` and `em-*` as references).
- Art prompts I give the user: a style block + sheets with exact counts/reading order, flat magenta #FF00FF background, no text; see the ember prompts below.

## Ember prompt layout used for World 1 (reuse for every new world)
Style block: "Polished mobile-game 2.5D, top-down 3/4 view (camera about 45 degrees above), glossy hand-painted look, clean cel shading, thin warm dark-brown outlines,
rich saturated colours, light from top left. Scale: a house door about 1.3 units, a lamp post 1.6, a tree 3-4, an explorer 1. No text, no characters."
- Sheet 1: 3x3 seamless ground tiles (9 named textures).
- Sheet 2 and 3: 4x4 object sheets (16 named objects each) on flat magenta #FF00FF.
- Sheet 4: animation strips, 5 rows x 6 frames, identical frame size and object position in each frame (water/lava, waterfall, glowing crystal, glowing plate, particles).


## World 3: Sandstone Reach (built)
- Locations (`world/locations/sand.ts`, derived from the Grove layouts and re-dressed): dune-haven, whispering-dunes, sunstone-canyon (plateau + oasis + bridge), scarab-tomb (carve, quicksand pool + bridge, sealed portal to Frostglass Peaks).
- Themes `sand` / `sand-tomb` in `storybook/story.ts` (`sandKinds`, `SAND_SHARED`, `SCALE` entries for every `sr-*` id incl. `sr-bridge-*`, per-prefix bridge params `BRP`). Theme fields `br`, `line`, `shade`, `cliff`, `bankTex`, `pads` make plateaus/lakes/bridges re-skinnable.
- Encounter backdrops `sand` and `tomb`; art in `public/monster-quest/world/*/sr-*`; plan and prompts in `docs/WORLD3_SANDSTONE_REACH.md`.


## World 4: Frostglass Peaks (built)
- Locations (`world/locations/frost.ts`, derived from the Grove layouts like sand.ts): snowdrift-village, pinefrost-pass, glasslake-basin (plateau + frozen lakes), crystal-cavern (carve, freezing pool + bridge, sealed portal to Tidewhisper Coast).
- Themes `frost` / `frost-cave` in story.ts (`frostKinds`, `FROST_SHARED`, `fg-*` SCALE incl. `fg-bridge-*`, `BRP.fg` bridge params, ANIM_K). Encounter backdrops `frost`, `frostcave`. Art `fg-*`; plan/prompts `docs/WORLD4_FROSTGLASS_PEAKS.md`.
- Anim glow and sprite fringes were recoloured pink to icy blue after cutting.

## World 5: Tidewhisper Coast (built)
- Locations (`world/locations/coast.ts`, derived from the Frost/Grove layouts): pearl-harbor, driftwood-beach, coral-lagoon (plateau + lagoons), sunken-grotto (carve, pool + bridge, sealed portal to Skyspire Crown).
- Themes `coast` / `coast-cave` (`coastKinds`, `COAST_SHARED`, `tc-*` SCALE incl. `tc-bridge-*`, `BRP.tc`, ANIM_K); encounter backdrops `coast`, `grotto`; art `tc-*`; plan `docs/WORLD5_TIDEWHISPER_COAST.md`.
- Bridge deck sheets had corner posts, so tile windows sit between them (deck-h sx117/sw268, deck-v sy112/sh230).

## World 6: Skyspire Crown (built)
- Locations (`world/locations/sky.ts`): cloudgate-plaza, windswept-meadows, sunspire-terraces (plateau), crown-sanctum (carve, pool + bridge, sealed final gate "more adventures soon").
- Themes `sky` / `sky-cave` (`skyKinds`, `sk-*` SCALE, `BRP.sk`), backdrops `sky`, `sanctum`; plan `docs/WORLD6_SKYSPIRE_CROWN.md`.
- All new worlds use `serverZone: 'forest'` (the only server zone known to exist; see README stopgaps) and zone pools use REAL species ids from `monsterSprites.ts` (unknown ids fall back to the slime sprite).
