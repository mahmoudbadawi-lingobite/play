-- Run this once if your escape_rooms table was created before theme existed.
alter table public.escape_rooms add column if not exists theme text;
