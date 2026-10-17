# Drop 2 - nine 3D worlds, character collection, Style Store Admin

## What's new
- **Nine animated 3D worlds** for Block Quest, based on your "Nine Worlds" picture: English Village, Adventure Awaits,
  Explore Learn Grow, Keep Going, Big Dreams, Be Brave, Play Learn Achieve, Reach Higher, Small Steps Big Progress.
  Each has moving things (balloons, flags, buses, torches, UFOs, gondolas, snow, waterfalls, ship, ferris wheel,
  rocket flames, water wheel...).
- **Learn & Run in 3D**: third-person run with your own hero (and pet), lanes, collectible coins, friendly obstacles
  the hero hops over, letter bridges, castle-door boss gates, question card on top of the action.
- **Pick Your World**: nine picture cards of the real 3D worlds, with the live world and your hero above them.
- **27 characters + 2 sets** in Sets & Collections (original blocky characters + the LingoBite Cookie mascot;
  Adventurous Girl / Adventurous Boy are gender-specific sets). The Pig Farmer was NOT added.
- **Style Store Admin** (`/admin/store`, admins only): add outfits, hats, hairstyles, accessories, shoes, backpacks,
  pets, characters and sets with a live 3D preview - pick a shape + colors, or use your own 3D model (.glb).
- Phones get a lighter version automatically; devices without WebGL keep the flat 2D game.

## Files (copy over the repo root, keeping the paths)
New: src/features/world3d/*, src/features/avatar/characters3d.ts, remoteCatalog.ts, useCatalog.ts,
     src/components/games/blockQuest/SceneView.tsx, WorldCards.tsx, src/pages/StoreAdminPage.tsx,
     supabase/store_items_patch.sql, public/models/README.txt
Updated: src/App.tsx, src/components/layout/Header.tsx, src/pages/StorePage.tsx, src/pages/AvatarPage.tsx,
     src/components/games/blockQuest/BlockQuestGame.tsx, StartPanel.tsx, worlds.ts,
     src/features/avatar/Avatar2D.tsx, avatarStore.ts, catalog.ts, items3d.ts, kit.ts, model3d.ts, snapshot.ts
No new packages (package.json is unchanged).

## One-time database step (needed only for Store Admin)
Supabase > SQL Editor > New query > paste supabase/store_items_patch.sql > Run.
Everything else works without it.

## Adding your own 3D models
Put .glb files in public/models/ on GitHub; the address is https://YOUR-NAME.github.io/play/models/file.glb
Use that address in Store Admin > "My own 3D model (.glb)".
