# Monster Quest Phase 2 - install notes

1. Supabase SQL editor: run `supabase/monster_quest_phase2_patch.sql` (after the Phase 1 patch; safe to re-run).
2. GitHub: upload the zip contents, keeping paths. The whole `src/features/monsterQuest/` folder is replaced; no other app files change this time.

## New in Phase 2
- **7 worlds** (Forest, Desert, Tundra + Jungle L5, Volcano L6, Coral Coast L7, Crystal Cave L8, Monster City L10), each with its own scenery. **62 monsters** (45 new, 14 evolved forms, 4 legendaries).
- **Training Dojo** (My Monsters > Train): 5 quiz questions give the monster XP and level-ups.
- **Evolution** with animation: by monster level, or with an Evolution Stone (Zapling > Voltstorm). Evolved monsters keep their level and gain the stat difference.
- **Items:** potions (battle), XP candy (monster XP), evolution stones; shop has categories.
- **Trainer style:** 56 wardrobe items (body, skin, hair style/colour, hats, jackets, pants, shoes, backpacks, extras); bought with coins/gems or unlocked by level; shown in the world, dashboard and profile.
- **Battle Arena (vs computer trainers):** turn-based, speed order, type effectiveness, critical hits, Attack / Special (answer a question: correct = 90 power and 50% crit, wrong = weak) / Defend / Switch / Potion, 1-3 opponents by difficulty. Everything is decided on the server.
- **Daily and weekly missions** with claimable coin/gem rewards; battle-wins leaderboard.

## Server-side checks (all in SECURITY DEFINER functions)
Damage, crits, turn order, rewards, item use, evolution requirements, purchases and mission claims. Daily caps (configurable in `mq_config`): answer XP, battle XP, training sessions.

## Still to come
Online player-vs-player and ranked battles, achievements, classroom competitions and the teacher analytics dashboard, background music, evolution-by-challenge.
