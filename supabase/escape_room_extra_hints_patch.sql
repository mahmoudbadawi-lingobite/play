-- Run this once in the Supabase SQL editor.
-- Adds two optional "fallback hint" fields per hotspot:
--   locate_hint_extra    - shown if a player keeps missing the spot
--   question_hint_extra  - shown if a player keeps answering wrong
-- Both are optional (blank = no extra hint shown) and safe to leave
-- empty on existing rooms.

alter table public.escape_room_hotspots
  add column if not exists locate_hint_extra text not null default '',
  add column if not exists question_hint_extra text not null default '';
