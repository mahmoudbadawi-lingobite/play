# Update: list fix, outfit text sizes + 2 lines, country flags, sidebar name

Copy these files over your repo root, keeping the folder paths. No new packages. No new SQL.

## Changed files
- src/pages/StoreAdminPage.tsx        list fix, text size sliders, 2 lines per side, flag picker
- src/features/avatar/catalog.ts      text model (sizes / 2nd line), 40 flag items in Accessories
- src/features/avatar/model3d.ts      draws 1-2 lines per side with their own sizes; raises the arm for a flag
- src/features/avatar/items3d.ts      the flag: gold pole, waving two-sided cloth, held in the right hand
- src/features/avatar/snapshot.ts     shop thumbnail view for flags
- src/features/avatar/Avatar2D.tsx    flat 2D fallback also shows the held flag
- src/components/layout/Header.tsx    admin link text: "Style Editor"
- src/index.css                       sidebar (Kid Mode): the admin link no longer gets the "Style Store" name

## New files
- src/features/avatar/flags.ts        list of the 40 flags (name, price)
- public/flags/*.png                  the 40 flags, cut out of your picture with transparent backgrounds

## Notes
- Flags cost 40 coins (United Nations 60). Change prices in the Style Editor like any other item.
- Old outfits with text keep working (sizes default to 100%, second line empty).
- In the Style Editor you can also create a new accessory with Shape = Flag and pick the country.
