# Fix: escape room delete silently failing + group chat "clear" error

## Bug 1: Deleting a room did nothing (no error shown)
Root cause: `escape_room_results` (the table tracking play counts - the
"4 plays" you see on each card) referenced `escape_rooms` **without**
`on delete cascade`. Once a room had been played even once, Postgres
blocked the delete with a foreign-key violation (the 409 in your
console). On top of that, the app never checked for that error, so it
failed completely silently instead of telling you.

Fixed both parts:
- The foreign key now cascades, so deleting a room also cleans up its
  play history (same as it already does for hotspots and reports).
- `deleteEscapeRoom()` now throws on failure, and all three places that
  call it (My Escape Rooms, Escape Rooms browse page, Admin page) now
  show an alert if a delete ever fails again in the future, instead of
  silently doing nothing.

## Bug 2: "DELETE requires a WHERE clause" when clearing group chat
Your Supabase project has a delete-safety guard that blocks any
unqualified `DELETE` - even inside a database function - as a safeguard
against accidental full-table wipes. `clear_group_chat()` ran
`delete from admin_group_messages;` with no `where`, which tripped it.
Fixed by adding a harmless `where true`, which still deletes every row
exactly as before but satisfies the guard.

## Files in this delivery

### New file
- `supabase/escape_room_delete_and_clear_chat_patch.sql` — **run this
  once in the Supabase SQL editor.** Fixes the foreign key and
  re-creates the `clear_group_chat()` function with the fix.

### Full file replacements
- `src/lib/escapeRoomService.ts` — `deleteEscapeRoom()` now throws on error.
- `src/pages/MyEscapeRoomsPage.tsx`
- `src/pages/AdminPage.tsx`
- `src/pages/EscapeRoomsPage.tsx`
  — all three now catch delete errors and show an alert instead of
  failing silently.
- `supabase/schema.sql` — kept in sync with both fixes (only matters for
  brand-new database setups).

## Deploy steps
1. Run `supabase/escape_room_delete_and_clear_chat_patch.sql` in the
   Supabase SQL editor.
2. Upload the 4 source files to their matching paths via GitHub's web UI.
3. Try deleting "Weapons" or "Memphis" again - should work now.

## Verified before delivery
- `tsc -b` — clean
- `npm run build` — clean
- `oxlint src` — 0 warnings, 0 errors across all 52 source files
