# Monster Quest: World 1 drop

Replaced: world renderer, zones, HUD (`src/features/monsterQuest/world/*`, `screens/Explore.tsx`).
Edited elsewhere: `EncounterModal.tsx` only wraps the monster in the supplied animation class (flow/logic untouched).
Untouched: every server function / `api.ts`, question flow, Shop, Collection, Inventory, Wardrobe, SQL.

## Behaviour
- Monsters are hidden. Nothing wild is drawn in the world; grass rustles harder around you on encounter ground. A monster appears only in the capture screen, with its own artwork, animated by the supplied keyframes (`world/monsterSprites.ts` picks the animation per species id).
- Seven playable explorers (public/monster-quest/players/*), cut out of the supplied sheets unchanged. Picker opens on first visit and from the HUD (stored in localStorage).
- Movement: 160 px/s, 0.1 s accel, 0.08 s stop, distance-field collision, tap-to-walk (A*).

## Stopgaps until database changes are approved
1. Every World 1 location calls `mq_start_encounter('forest')` (`LocationDef.serverZone`).
2. Chests open with a placeholder message; no rewards (no chest function exists).
3. Rare spots use the same call with a higher trigger rate.
4. Quest progress, visited places, chosen explorer: localStorage only.
