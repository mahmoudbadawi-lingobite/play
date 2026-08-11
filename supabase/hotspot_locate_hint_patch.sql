-- Run this once to add the "locate hint" field to an already-created database.
-- This lets each hotspot store a separate clue for FINDING the object (shown
-- before the player clicks it) apart from the quiz question (shown after).

alter table public.escape_room_hotspots
  add column if not exists locate_hint text not null default '';
