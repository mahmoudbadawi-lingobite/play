# Update: Style Editor + game screen tweaks

Files (copy over the repo root, keeping the paths):
- src/components/games/blockQuest/BlockQuestGame.tsx   smaller/higher question card, finish panel moved to the side
- src/features/world3d/runner.ts                        slides the view so the hero stays fully visible next to the side panel
- src/pages/StoreAdminPage.tsx                          the Style Editor (edit ANY item, price table, text on outfits/sets)
- src/features/avatar/catalog.ts, remoteCatalog.ts, avatarStore.ts, model3d.ts   support for edits + printed text

No new packages. No new SQL (it uses the table from supabase/store_items_patch.sql).

Not included: the second "Style Store" link in your sidebar. Open src/components/layout/Header.tsx (or your sidebar file),
search for "admin/store" and change the text of that link to "Style Editor".
