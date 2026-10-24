# Update: Treasure Hunt live rooms + 3 more worlds

Copy these files over your repo root, keeping the folder paths. No new packages. No new SQL.
This is built on top of your latest version (with the Saudi and Crystal worlds).

## New
- src/pages/HuntRoomPage.tsx                           /hunt (host or join) and /hunt/:code (lobby, countdown, the hunt)
- src/components/games/treasureHunt/huntNet.ts         rooms: Supabase Realtime (Presence + Broadcast), co-op rules
- src/components/games/treasureHunt/WorldPicker.tsx    the world cards, shared by the solo screen and the lobby
- public/treasure/{autumn,night,frost}/*.png           3 new worlds (Autumn Woods, Moonlit Ruins, Frozen Valley)
- public/treasure/previews/{autumn,night,frost}.webp   their cards

## Edited
- src/App.tsx                       routes /hunt and /hunt/:code
- src/pages/GamePickerPage.tsx      "Treasure Hunt with friends" card
- src/pages/LibraryPage.tsx         link "Treasure Hunt rooms"
- treasureHunt/TreasureHuntGame.tsx  works solo or inside a room (other explorers, live leaderboard, co-op)
- treasureHunt/huntEngine.ts        draws the other players (name tags) and reports my position
- treasureHunt/huntQuestions.ts     same questions for everyone from a shared seed
- treasureHunt/huntAssets.ts, huntWorld.ts, huntClues.ts, huntSound.ts   the 3 new worlds

## How it plays
- Anyone (student, guest or teacher) opens a game, taps "Treasure Hunt with friends" (or Library > Treasure Hunt rooms) and hosts. A 5-letter code and an invite link appear.
- 2 to 10 players. The host picks Race or Co-op, the world (or Surprise me) and the difficulty, then starts. Nobody can join once a hunt is running.
- Race: everyone has their own hearts on the same maps and questions. Ranking: most chests, then who was faster, then coins. Top 3 get bonus coins.
- Co-op: one team, shared hearts (+1 per friend), one chest at a time. The first player to reach the chest answers; the others see who is answering. Everybody sees the team score.
- Each player's accuracy and XP are saved with the normal results (game key "treasure-hunt").
- Nothing is stored in the database; rooms live on Supabase Realtime. If Realtime is switched off in your project, turn it on (Project settings > API > Realtime).
