-- Run this once if your escape_rooms table was created before story_text existed.
alter table public.escape_rooms add column if not exists story_text text;
