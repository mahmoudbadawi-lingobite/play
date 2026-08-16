# One prompt, one paste: story + clues in a single round-trip

No database changes - all 5 files are frontend only.

## What changed

**Before:** copy Prompt 2 (story) → paste into AI → copy the reply → save
it somewhere. Copy Prompt 3 (clues) → attach image → paste into AI →
download an Excel template → copy the AI's table into it → upload the
file.

**Now:** copy the single merged Prompt 2 (story + clues together, image
attached) → paste into AI → copy the AI's ENTIRE reply → paste it once
into a new "Paste the AI's reply here" box in the app → the story field
and the clue pins fill in automatically.

The Excel template workflow still exists as a fallback (some teachers
may prefer it, or want to hand-edit before importing) - just now it's an
alternative, not the only path.

### How it works
- The two old prompts (story, clues+positions) are merged into one. The
  AI is asked to reply with a `STORY:` section followed by a `CLUES:`
  section containing the same clue table as before.
- A new parser (`parseStoryAndCluesReply`) splits the pasted text on
  those two markers (tolerant of markdown bold/heading formatting around
  them, and of extra AI chatter before/after) and parses the table with
  the same logic the `.xlsx` importer already used - both now share one
  underlying row-parsing function, so behavior is identical either way.
- Clue placement (auto-drop pins with AI-estimated coordinates, queue the
  rest for click-to-place) works exactly the same as the file-import path
  did, since both now funnel through the same integration logic inside
  `HotspotEditor`.

I stress-tested the parser against a "messy" reply (extra chatty preamble
from the AI, a stray blank row, an object name containing the literal
word "story") to make sure it doesn't get confused by conversational
filler - it handled all of that correctly.

## Files in this delivery (full replacements)
- `src/lib/hotspotTemplate.ts` — new `parseCluesTableText` and
  `parseStoryAndCluesReply` functions; the `.xlsx` parser now shares the
  same row-parsing logic as the new text parser.
- `src/components/escapeRoom/PromptGeneratorPanel.tsx` — merged prompt,
  new "Paste the AI's reply here" box, `onImportStory`/`onImportClues`
  callback props.
- `src/components/escapeRoom/HotspotEditor.tsx` — new
  `externalImportItems`/`onExternalImportConsumed` props so an import can
  come from outside the component (the paste box) as well as from the
  file picker, using one shared placement function either way.
- `src/pages/CreateEscapeRoomPage.tsx` / `EditEscapeRoomPage.tsx` — wire
  the new callbacks between the prompt panel and the hotspot editor.

## Deploy steps
Just upload these 5 files to their matching paths via GitHub's web UI.

## Verified before delivery
- `tsc -b` — clean
- `npm run build` — clean
- `oxlint src` — 0 warnings, 0 errors across all 52 source files
- Manually tested the parser against a clean AI-style reply and a messy
  one (extra commentary, blank row) - both parsed correctly
