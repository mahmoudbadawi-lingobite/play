# Drop 1 - 3D character, Style Store, My Avatar

## What's new
- **Choose your hero** (boy / girl) the first time a student opens Block Quest, the Style Store or My Avatar.
  Each character has its own look and its own saved looks; items they own stay owned if they switch.
- **Style Store** (`/store`): outfits, hats, hairstyles, glasses & accessories, shoes, backpacks, pets, and
  complete themed sets (Space Explorer, Lava Hero, Candy Adventurer, Sky Pilot - a boy and a girl version each).
  The store only shows items that suit the chosen character (boy / girl / unisex). Search, rarity filter,
  try-on preview in a spinning 3D view, Buy / Wear. Sets cost less than buying the pieces.
- **My Avatar** (`/avatar`): drag to spin, zoom, change every equipped slot, skin tone and hair colour,
  and keep up to 6 named favourite looks per character.
- The hero also appears in the header (with coins), the student dashboard (with an XP level bar), the
  Block Quest start and finish screens, and the reward screen after every game.
- Everything is built from rounded blocks in code (no downloaded assets). If WebGL is not available the
  app automatically shows the flat 2D character instead.

## Files (copy over the repo root, keeping the paths)
New
- src/features/avatar/*            (catalog, store, 3D builders, stage, snapshot, 2D fallback, UI helpers)
- src/pages/StorePage.tsx
- src/pages/AvatarPage.tsx
Updated
- package.json, package-lock.json   (adds `three` and `@types/three`; run `npm ci`)
- src/App.tsx                       (lazy routes /store and /avatar)
- src/components/layout/Header.tsx  (avatar chip + Style Store link)
- src/pages/DashboardPage.tsx       (student hero card with level bar)
- src/components/games/GameShell.tsx (hero on the reward screen)
- src/components/games/blockQuest/BlockQuestGame.tsx, Scene.tsx, StartPanel.tsx
Delete (replaced by src/features/avatar)
- src/components/games/blockQuest/avatarStore.ts
- src/components/games/blockQuest/Avatar.tsx
- src/components/games/blockQuest/AvatarShop.tsx

## Notes
- No SQL. Coins, owned items and looks are saved on the device (key `lingobite:avatar:v2`).
  Old Block Quest coins and hats are carried over automatically; old shirts are refunded in coins.
- The 3D code loads only on the avatar screens (about 142 KB gzipped, separate chunk).
- Low-power phones get lighter rendering automatically. To force it: `localStorage['lingobite:quality']='low'` (or 'high').
- The run screen in Block Quest still uses the 2D scene (the hero's hair, outfit, shoes and hat match);
  the full 3D run comes in drop 2.
