Treasure Hunt update: only changed and new files. Copy the folders over your project (same paths).

Changed code (src/):
  components/games/treasureHunt/huntQuestions.ts   chest count = number of items (max 15)
  components/games/treasureHunt/huntWorld.ts       15+ landmarks per world, extra landmarks, maps that grow with chest count, Egypt world
  components/games/treasureHunt/huntClues.ts       clues and place names for all new landmarks
  components/games/treasureHunt/huntAssets.ts      new picture lists and anchors, Egypt world
  components/games/treasureHunt/huntEngine.ts      faster walking on bigger maps
  components/games/treasureHunt/huntSound.ts       Egypt uses the desert music
  components/games/treasureHunt/WorldPicker.tsx    "Up to N chests" labels
  components/games/treasureHunt/TreasureHuntGame.tsx, pages/HuntRoomPage.tsx   chest-count text and calls

New pictures (public/treasure/):
  jungle, autumn, night: 9 landmarks each; desert: 9; saudi: 16; egypt/: whole new world; previews/egypt.webp
