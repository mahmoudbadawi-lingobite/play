# Monster Quest (Phase 1) - install notes

1. Supabase SQL editor: run `supabase/monster_quest_patch.sql` once (safe to re-run). It creates the mq_* tables, RLS, the server-side game functions and seed data (3 zones, 17 monsters, 4 orbs, 38 starter questions).
2. GitHub: upload the files in this zip, keeping the folder paths. Edited existing files: `src/App.tsx`, `src/pages/HomePage.tsx`, `src/pages/LibraryPage.tsx`, `src/components/layout/Header.tsx`. Everything else is new, under `src/features/monsterQuest/`.
3. Route: `/monster-quest` (sign-in required; wrapped in ConsentGate like other games).

## Controls
Arrow keys / WASD, tap any tile (auto-walks), or the on-screen controller (shown automatically on every touch device, phones and iPads; hold two arrows for diagonals). Desktop players can toggle it with the Controller button.

## Server-side security
Students cannot write to any mq_ table and cannot read mq_questions (answers). Encounters, questions, answer checking, capture rolls, XP, coins, purchases and team changes all run in SECURITY DEFINER functions. XP goes into the existing `profiles.total_xp` (same level formula); each finished encounter adds one `game_results` row (`game_key = 'monster-quest'`) so teacher rosters include it. Daily XP cap and all balance numbers are in `mq_config`.
Known limit: spelling/listening questions using browser text-to-speech send the spoken text to the browser. Use audio file URLs for anything competitive.

## Built in Phase 1
Dashboard, isometric world (Forest, Desert, Tundra; level-gated), grass encounters, 9 question types, capture meter + orbs, collection (search/filter/sort/favorite/team of 6), inventory, shop, encyclopedia + type chart, leaderboard, profile + sound toggle, teacher/admin Question Bank (add/edit/hide/delete, xlsx/csv/json import + template, generate from Game Library sets, per-question accuracy).

## Not built yet (shown as locked, not faked)
Battle Arena + multiplayer, quests/missions/achievements, evolution + training, potions/boosters, trainer outfits, music, Jungle/Volcano/Ocean/Crystal Cave/Monster City, classroom competitions, teacher analytics dashboard.

## Artwork
Your two sheets contain actual Pokémon characters and a Poké Ball logo, so I used them only as style reference and shipped none of that art. Monsters, trainer, orbs and logo are original SVG drawn from data (`art` column of `mq_species`). To use your own PNGs later, set `sprite_url` on a species row.
