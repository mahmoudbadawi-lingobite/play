# Monster Quest: World 1 drop

Replaced: world renderer, zones, HUD (`src/features/monsterQuest/world/*`, `screens/Explore.tsx`).
Untouched: every server function / `api.ts`, `EncounterModal`, question flow, Shop, Collection, Inventory, Wardrobe, SQL.

## What is in World 1 (Emberlands)
Ember Village, Mushroom Valley, Ancient Ember Ruins, Molten Caverns, joined by gateways. Worlds 2-6 show on the world-select screen as "Coming next".

## Files
- `world/engine.ts` movement (160 px/s, 0.1 s accel, 0.08 s stop), distance-field collision, camera, y-sorted rendering, tap-to-walk (A*), interactions, encounters (20 %/s of motion on encounter ground, 40 %/s on rare spots), transitions
- `world/paintLocation.ts`, `paintProps.ts` procedural storybook art (all original, no external images)
- `world/locations/emberlands.ts` the four layouts as data
- `world/animSampler.ts` runs `monsterAnimations.css` (your keyframes, unchanged) on hidden <img> elements and draws their computed pose to the canvas
- `world/monsterSprites.ts` species id -> sprite name map (one-line swaps)
- `public/monster-quest/sprites/*.png` the 40 supplied sprites

## Stopgaps until you approve database changes
1. Every World 1 location calls `mq_start_encounter('forest')` (`LocationDef.serverZone`), because `forest` is the only existing beginner zone (unlock level 1). Wild monsters therefore come from the forest pool, not the Emberlands roster.
2. Chests open with a placeholder message. There is no chest-reward server function, so no rewards are granted.
3. Rare spots use the same call with a higher trigger rate; they cannot force a rare species.
4. Quest progress, visited places and chest-opened flags are stored in localStorage only.
