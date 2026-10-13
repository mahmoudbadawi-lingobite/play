# Block Quest - update notes

New game: **Block Quest** (key `block-quest`). Blocky worlds, a three-lane track, and a
portal gate for every question. Works with any content set (min 4 items, 3 different terms).

## Files (copy over the repo root, keeping the paths)

New
- src/components/games/blockQuest/BlockQuestGame.tsx   main flow (start, run, finish)
- src/components/games/blockQuest/engine.ts            builds gates from items, distractors
- src/components/games/blockQuest/Scene.tsx            2.5D track, portals, bridge, boss gate
- src/components/games/blockQuest/Avatar.tsx           blocky character + hats
- src/components/games/blockQuest/avatarStore.ts       coins + avatar saved on the device
- src/components/games/blockQuest/AvatarShop.tsx       hats / shirts / skin shop
- src/components/games/blockQuest/StartPanel.tsx       world picker, race mode, start
- src/components/games/blockQuest/Panels.tsx           answer buttons, letter tray, boss input
- src/components/games/blockQuest/worlds.ts            5 world themes
- src/components/games/blockQuest/blockQuest.css       animations + chunky buttons

Updated (small edits)
- src/types/index.ts                  adds 'block-quest' to GameKey
- src/games/registry.ts               registers the game (listed first in the picker)
- src/components/games/GameShell.tsx  registers the component; passes `skill` to games
- src/pages/HomePage.tsx              adds Block Quest to the landing page list

## Database
No SQL needed. `game_key` is a free-text column, so results, guest XP, leaderboards and
LingoTrace `ref` reporting all work as for the other games.

## Behaviour
- Gate types: portal (all skills), listen (vocab/spelling, if the browser has speech),
  letter bridge (spelling + short single vocab words), typing boss (last gate).
- Wrong portal is crossed out; after 2 misses (or time-up in race mode) the right one glows.
- Accuracy sent to onFinish = share of gates cleared on the first try.
- Coins/avatar live in localStorage key `lingobite:blockquest:v1` (cosmetic only).
- Race mode: checkbox on the start screen, or lock it on with `?mode=race` on the link.

## Checked
tsc -b, npm run build, oxlint all clean. An automated playthrough (wrong portal, correct
portal, wrong then right boss answer, finish callback) passed.
