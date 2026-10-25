# Update: new Kid Mode skin (default), collapsed sidebar on phones

Copy these files over your repo root, keeping the folder paths. No new packages, no SQL.

## Changed
- index.html                              sets kid theme + sidebar state before first paint
- src/contexts/ThemeContext.tsx           kid is the default; only an explicit "classic" is stored (new key `lingobite-play-theme-v2`, so everyone starts in kid mode once)
- src/lib/kidSidebar.ts                   phones (<=767px): always start collapsed, nothing remembered
- src/components/layout/Header.tsx        active-page highlight, icon/label slots
- src/components/common/ThemeToggle.tsx   icon/label slots
- src/pages/GamePickerPage.tsx, LibraryPage.tsx, HomePage.tsx   markup hooks for the new cards
- src/index.css                           old kid block removed (moved)
- src/main.tsx                            imports kid-skin.css

## New
- src/kid-skin.css                        the whole skin
- public/kid/*.webp                       artwork cut from the approved design (cards, arrows, icons, scenery)

## Notes
- Logo is the original public/logo.png.
- The "AR" button is the Arabic language switch; it shows the headset icon from the design.
- Library: only the filter chips stay pinned now (the title scrolls away so the sky art stays visible).
