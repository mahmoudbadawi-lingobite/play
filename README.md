# Escape Room: easier clue creation (locate hints + JSON templates + draggable pins)

## Problem this fixes
Each hotspot only had one text field (`clueText`), shown BOTH before the click
(as the "find it" clue) AND after the click (as the quiz question). That's why
a question like "Which spelling is correct?" gave the player zero information
about where to click before answering — the screenshot you sent.

## What changed

1. **Locate hint vs. question, split apart.** Every hotspot now has:
   - `locateHint` — shown BEFORE the click, a short visual/positional
     description ("the pink spiral shell near the bottom of the steps") that
     helps the player find the object, without giving away the answer.
   - `clueText` — unchanged field name, but now purely the QUESTION, shown
     only AFTER they click.

2. **AI prompt generator rewritten.** The 3rd prompt (clues) now forces the
   AI to produce both fields per object, plus asks the AI to look at the
   background image (attached by the teacher) and estimate each object's
   x/y position. Output is strict JSON, not free text.

3. **JSON template import.** Teachers can:
   - Paste the AI's JSON reply into a `.json` file and upload it directly, or
   - Download a blank template (button in the prompt generator) and fill it
     in by hand, no AI needed.
   - On upload, any item with AI-estimated coordinates is placed immediately
     as a draggable pin; items without coordinates queue up so the teacher
     just clicks the matching object in the image to drop each one.

4. **Draggable pins.** All hotspot markers (imported or manually placed) can
   now be dragged to fine-tune their position, instead of only being
   click-once-and-done.

5. **Room title defaults to the theme.** On the Create page, the title field
   auto-fills with whichever theme button is selected, until the teacher
   types their own title — then it stops overwriting it.

## Files in this delivery

### New files
- `src/lib/hotspotTemplate.ts` — parses/validates the JSON template, builds
  a blank template for download.
- `supabase/hotspot_locate_hint_patch.sql` — **run this once in the Supabase
  SQL editor** (not part of the app deploy) to add the `locate_hint` column
  to your existing `escape_room_hotspots` table.

### Full file replacements (replace the existing file with this one)
- `src/lib/escapeRoomService.ts`
- `src/components/escapeRoom/HotspotEditor.tsx`
- `src/components/escapeRoom/PromptGeneratorPanel.tsx`
- `src/pages/EscapeRoomPlayPage.tsx`
- `src/pages/CreateEscapeRoomPage.tsx`
- `src/pages/EditEscapeRoomPage.tsx`
- `src/types/index.ts` — only the `EscapeRoomHotspot` interface changed
  (added `locateHint: string;`); rest of the file is untouched, included
  in full for convenience.
- `supabase/schema.sql` — only the `escape_room_hotspots` table definition
  changed (added `locate_hint text not null default '',`); rest of the file
  is untouched, included in full for convenience.

## Deploy steps
1. Run `supabase/hotspot_locate_hint_patch.sql` in the Supabase SQL editor
   first (safe — uses `add column if not exists`).
2. Upload the other files to their matching paths via GitHub's web UI,
   overwriting the existing ones.
3. `schema.sql` doesn't need to run anywhere for existing databases — it's
   just kept in sync for future fresh setups.

## Verified before delivery
- `tsc -b` — clean
- `npm run build` — clean
- `oxlint src` — 0 warnings, 0 errors across all 51 source files
