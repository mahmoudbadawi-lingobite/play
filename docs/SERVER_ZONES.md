# Server zones for worlds 3-6

Client side (done): Sandstone Reach asks `mq_start_encounter('desert')`, Frostglass Peaks `'snow'`, Tidewhisper Coast `'ocean'`,
Skyspire Crown `'sky'`. Worlds 1-2 still use `'forest'`. If the database rejects a zone, `WorldView.tsx` retries with `'forest'`,
so nothing breaks before the database is updated.

Database side (needs approval; the SQL is not in this project): add rows to the zones table and make `mq_start_encounter`
pick species whose `zones` array contains the zone id. Species per zone (same lists as the client pools):
- desert: dunepup, cactling, sandwisp, sunscarab, solarix, pebblin, runeling
- snow: frostkit, snowpuff, pengli, snowhoot, rimeram, shardling, crystalynx, aurorix, wispling
- ocean: pinchy, shellby, blupp, splashet, jellibloom, aquarion, coralynx
- sky: puffwing, starlet, petalfay, stormpuff, gryphlet, starhorn, lunaowl, celestyrax
Arena pictures exist for desert, snow and ocean; `sky` has none yet and uses the forest arena (add `arenas/sky.webp` + an entry in `scene/arenas.ts`).
