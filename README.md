# "Outside resources" option + fix for the pasted-prompt bug

No database changes - both files are frontend only.

## 1. New: "I have outside resources I'll attach with the prompt"
A checkbox now sits above the vocabulary/grammar/reading/spelling boxes
in the AI Prompt Generator. When checked:

- Both the **image prompt** and the **story + clues prompt** now tell the
  AI that an outside resource (worksheet, textbook page, reading passage,
  etc.) is attached alongside the prompt, and instruct it to analyze that
  resource first to decide the vocabulary/grammar/skills to build the
  room around.
- The four word-list boxes are relabeled "optional, adds to the attached
  resource" - anything typed in them is still included, just as
  supplementary content on top of whatever the AI extracts from the
  attachment, instead of being the only source.
- A reminder banner appears ("📎 Remember to attach your resource
  file(s)...") so it's not easy to forget the actual attach step in the
  AI chat.

When the checkbox is off, everything behaves exactly as before.

## 2. Bugfix: pasting the prompt instead of the AI's reply
This is what caused the "numbers don't appear" issue - the prompt's own
`OUTPUT FORMAT` section contains an example skeleton with `STORY:` and
`CLUES:` marker lines, showing the AI what to reply with. If someone
pastes the *prompt itself* into the "Paste AI's reply" box (instead of
the AI's actual response), the parser was matching those instructional
marker lines and "successfully" importing the literal placeholder text
(`<your Part 1 story text here>`, `| 1 | ... | ... |`) as if it were real
content - silently, with no warning.

Fixed by rejecting obvious placeholder content (`...`, `…`, or text
wrapped in `<angle brackets>`) at both the per-clue-row level and the
story level, with a clear, specific error message pointing at the actual
mistake instead of silently "succeeding" with garbage.

Verified with three test cases:
- The exact prompt-instead-of-reply scenario → now correctly flagged
  with a clear error, 0 items imported.
- A clean, correctly-formatted AI reply → still parses perfectly (no
  regression).
- A "messy" reply with AI chatter/preamble around the STORY/CLUES markers
  → still parses correctly (tested in the previous delivery, still holds).

## Files in this delivery (full replacements)
- `src/lib/hotspotTemplate.ts`
- `src/components/escapeRoom/PromptGeneratorPanel.tsx`

## Deploy steps
Upload these 2 files to their matching paths via GitHub's web UI - no
SQL to run.

## Verified before delivery
- `tsc -b` — clean
- `npm run build` — clean
- `oxlint src` — 0 warnings, 0 errors across all 52 source files
- Manually re-ran the parser against your exact pasted prompt text, a
  clean valid reply, and a messy reply - all three behaved correctly
