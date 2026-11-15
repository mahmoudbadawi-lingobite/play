MONSTER QUEST - NEW BATTLE ARENAS
=================================
Copy the folders in this zip over your project (same paths, replace when asked). Only Monster Quest files are included.

NEW  public/monster-quest/arenas/*.webp          the 8 arena pictures (one per zone id) + brazier.webp (animated brazier strip)
NEW  src/features/monsterQuest/scene/arenas.ts   all tunable numbers (brazier positions, where monsters stand, which monsters fly)
NEW  src/features/monsterQuest/scene/ArenaStage.tsx  draws the picture + the two animated braziers
NEW  src/features/monsterQuest/scene/arena.css   layout / animation styles of the battle screen
EDIT src/features/monsterQuest/screens/Arena.tsx battle screen markup (HUD over the picture, fighters on the ground / flying)

Zone id -> picture:  forest, desert, snow (Frostpeak Tundra), jungle, volcano, ocean (Coral Coast), crystal, city (Monster City)

Tuning (all in scene/arenas.ts):
- brazier position per arena: ARENAS[zone].braziers  ->  x / y in pixels of the picture (y = the top of the column), w = size
- monsters:  STAND.dx (distance from centre), STAND.ground (ground line), STAND.size, STAND.fly (hover height), STAND.lunge (attack dash)
- flying monsters: FLYING_MONSTERS list (drakko, aero, bugsy, skyro, aquos, vampi, owly, stormy, zeezy)
