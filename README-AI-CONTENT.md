# AI content creation for the game library

Teachers no longer need to download or fill a template. On "Create a game":

1. Pick the skill and type the game title.
2. Set grade, number of items, subject/language, optional topic. Tick "I'll attach my material"
   and/or type words/notes. Copy the generated prompt (or use "Copy & open" for ChatGPT / Gemini /
   Claude), attach the worksheet/passage/word list in the AI chat, and send it.
3. Paste the AI's reply into the box. It is checked instantly (item count, preview, warnings).
4. Click "Create game" - one click saves it and opens the game picker.

The spreadsheet template is still there, tucked under "Prefer a spreadsheet?". Pasted AI content
wins if both are used.

The same panel is on "Edit game": pasted content replaces the old items when you press Save changes.

## Files (copy over the repo root, keeping the paths)
New
- src/lib/contentPrompt.ts                  builds the prompt per skill; forgiving reply parser
- src/components/common/AiContentPanel.tsx  the prompt + paste panel
Updated
- src/pages/CreateContentPage.tsx
- src/pages/EditContentPage.tsx

No SQL, no new packages.

## What the parser accepts
A JSON code block (what the prompt asks for), JSON with curly quotes / trailing commas,
a bare array, alternative key names (word/answer, definition/question/hint), a pasted pipe table,
or a tab-separated table. It rejects the prompt itself and unfilled placeholders, skips duplicate
terms, and warns when a clue contains its own answer, when fewer than 5 items are found, or when
spelling terms aren't single words.
