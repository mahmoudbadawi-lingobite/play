# Escape Room: adaptive hints + Excel-based clue template

## What's new

### 1. Adaptive hints (locate + question)
Each hotspot now has two new OPTIONAL fields:
- **Extra locate hint** - shown automatically once a player misses the
  spot 3 times, giving a more specific location clue than the original.
- **Extra answer hint** - shown automatically once a player answers the
  question wrong 2 times, giving a small nudge (first letter, category,
  etc.) without stating the answer outright.

Both are optional - leave them blank and nothing extra shows, gameplay
works exactly as before. Editable in the hotspot editor same as any other
field, and included in the AI prompt / Excel template (see below).

### 2. Clue template switched from JSON to Excel (.xlsx)
Per your note that most AI chat tools can't hand you a downloadable JSON
file - the template is now an actual Excel file, matching the same
pattern your other content templates already use in this app
(`contentTemplates.ts`):
- **"Download blank template (.xlsx)"** in the prompt generator gives a
  real Excel file with instructions, a header row, and one row per
  learning element already filled in - just needs the clue columns typed in.
- The Step 3 AI prompt now asks the AI to reply with a **markdown table**
  instead of JSON (every AI chat tool can produce this). The teacher
  copies that table and pastes it directly into the downloaded Excel
  file starting at the first empty row - pasting a table into
  Excel/Google Sheets auto-splits it into columns in virtually all cases.
  If a paste ever lands in a single column, the app now tells the teacher
  to use Excel's **Data → Text to Columns** with `|` as the delimiter.
- "Import clues from file" on the create/edit page now accepts `.xlsx`
  instead of `.json`, and gives row-by-row error messages (e.g. "Row 4:
  needs at least a Locate Hint, Question, and Correct Answer") instead of
  failing the whole file on one bad row.

## Files in this delivery

### New file
- `supabase/escape_room_extra_hints_patch.sql` — **run once in the
  Supabase SQL editor.** Adds `locate_hint_extra` and
  `question_hint_extra` columns to `escape_room_hotspots`.

### Full file replacements
- `src/lib/hotspotTemplate.ts` — rewritten to use the `xlsx` library
  (already a dependency in your project) instead of JSON, following the
  same pattern as your existing `contentTemplates.ts`.
- `src/lib/escapeRoomService.ts` — added the two new fields to the
  hotspot type, row mapping, and both insert paths.
- `src/components/escapeRoom/HotspotEditor.tsx` — two new optional
  textareas in the per-clue edit panel, `.xlsx` import instead of `.json`.
- `src/components/escapeRoom/PromptGeneratorPanel.tsx` — Step 3 prompt
  now asks for a markdown table (with the two new hint columns) instead
  of JSON; blank-template download now produces `.xlsx`.
- `src/pages/EscapeRoomPlayPage.tsx` — tracks misses/wrong-answers per
  clue and reveals the extra hint once the threshold is hit (3 misses for
  locate hint, 2 wrong answers for the answer hint).
- `src/pages/EditEscapeRoomPage.tsx` — loads the two new fields when
  editing an existing room.
- `src/types/index.ts` — added `locateHintExtra` / `questionHintExtra`
  to `EscapeRoomHotspot`.
- `supabase/schema.sql` — kept in sync with the same columns (only
  matters for brand-new database setups).

## Deploy steps
1. Run `supabase/escape_room_extra_hints_patch.sql` in the Supabase SQL
   editor.
2. Upload the other files to their matching paths via GitHub's web UI.

## Verified before delivery
- `tsc -b` — clean
- `npm run build` — clean
- `oxlint src` — 0 warnings, 0 errors across all 52 source files
