-- Run this once if your announcements table was created before text_color existed.
alter table public.announcements add column if not exists text_color text;
