# Update 7: the whole Monster Quest menu inside full screen

Copy these files over the project (same paths). No SQL.
* `world/WorldPanel.tsx`: the in-game menu now has every page of the side menu in the same order (Home, Explore, Monsters, Arena, Quests, Style,
  Dex, Bag, Shop, Ranks, Profile, plus Questions for teachers). "Explore" or "Back to game" (or Esc) returns to the exact same spot in the world.
  Buttons inside the pages that point to another page (for example Dashboard tiles or "Dress my explorer") switch tabs inside the game instead of leaving it.
* `world/world-panels.css`: on large screens the menu is the same left sidebar as the pages; on phones it is a compact row of buttons that scrolls sideways.
* `world/WorldView.tsx`: the Bag button opens Bag, the explorer button opens Profile (where explorers are switched and bought).
* `world/locations/emberlands.ts`: includes the build fix from before (`blockers ?? []`).
