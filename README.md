# Admin Chat: seen indicators + voice notes

## What's new

### 1. Seen indicators
- **DMs**: reuses the existing `read_at` column - no schema change needed
  beyond exposing it. Once the recipient opens the thread, small avatar
  stamps appear under your sent messages.
- **Group chat**: new `admin_group_read_receipts` table stores a single
  "last opened the group chat at ___" timestamp per admin. Under each of
  your messages, a small avatar appears for every other admin whose
  timestamp is at/after that message - live, via realtime.

### 2. Voice notes
- New 🎤 button next to the message input (both group chat and DMs).
- Click to start recording (red pulsing timer) → click Stop → a preview
  player appears with **Discard** / **Send** buttons, so nothing sends
  by accident.
- Uploads reuse your existing Cloudinary integration (same one used for
  escape room images), just with the `'video'` resource type - Cloudinary
  accepts audio uploads through that same endpoint.
- Voice messages render as a small audio player with a duration label in
  the chat bubble instead of text.

**⚠️ Please check your Cloudinary upload preset** (Cloudinary dashboard →
Settings → Upload → your unsigned preset) allows audio/video formats. If
it's currently restricted to images only, voice note uploads will fail
with a Cloudinary error until that's adjusted.

## Files in this delivery

### New files
- `src/lib/useVoiceRecorder.ts` — hook wrapping the browser's
  `MediaRecorder` API (start/stop/discard, timer, error handling).
- `supabase/admin_chat_seen_and_voice_patch.sql` — **run this once in the
  Supabase SQL editor.** Adds `audio_url` / `audio_duration_seconds`
  columns to both message tables, creates the group read-receipts table
  with RLS policies, and adds it to the realtime publication. Safe to
  re-run (uses `if not exists` / `drop policy if exists`).

### Full file replacements
- `src/lib/adminChatService.ts` — added voice note params to
  `sendGroupMessage`/`sendDirectMessage`, exposed `audioUrl`/
  `audioDurationSeconds`/`readAt` on both message types, added
  `markGroupChatRead`, `getGroupReadReceipts`,
  `subscribeToGroupReadReceipts`, and an `onUpdate` callback on
  `subscribeToDirectMessages` (needed so a message's seen-status updates
  live once the recipient reads it).
- `src/pages/AdminChatPage.tsx` — recording UI, seen-avatar stamps,
  voice note playback.
- `supabase/schema.sql` — kept in sync with the same table/column changes
  as the patch file (only matters for brand-new database setups).

## Deploy steps
1. Run `supabase/admin_chat_seen_and_voice_patch.sql` in the Supabase SQL
   editor first.
2. Double-check your Cloudinary unsigned upload preset allows audio/video
   formats (see warning above).
3. Upload the other files to their matching paths via GitHub's web UI.

## Verified before delivery
- `tsc -b` — clean
- `npm run build` — clean
- `oxlint src` — 0 warnings, 0 errors across all 52 source files
