-- Run this once in the Supabase SQL editor to add:
--   1. Voice note support (audio_url + audio_duration_seconds) to both
--      admin chat tables.
--   2. A "seen" tracking table for the group chat (per-admin last-read
--      cursor), used to stamp small avatars under a message once other
--      admins have caught up to it.
--
-- DM "seen" status needs no schema change - it already reuses the
-- existing read_at column on admin_direct_messages.

alter table public.admin_group_messages
  add column if not exists audio_url text,
  add column if not exists audio_duration_seconds integer;

alter table public.admin_direct_messages
  add column if not exists audio_url text,
  add column if not exists audio_duration_seconds integer;

create table if not exists public.admin_group_read_receipts (
  admin_id uuid primary key references public.profiles(id) on delete cascade,
  last_read_at timestamptz not null default now()
);

alter table public.admin_group_read_receipts enable row level security;

drop policy if exists "admin_group_read_receipts: admins read all" on public.admin_group_read_receipts;
create policy "admin_group_read_receipts: admins read all"
  on public.admin_group_read_receipts for select
  using (public.is_admin());

drop policy if exists "admin_group_read_receipts: admin upserts own row" on public.admin_group_read_receipts;
create policy "admin_group_read_receipts: admin upserts own row"
  on public.admin_group_read_receipts for insert
  with check (public.is_admin() and admin_id = auth.uid());

drop policy if exists "admin_group_read_receipts: admin updates own row" on public.admin_group_read_receipts;
create policy "admin_group_read_receipts: admin updates own row"
  on public.admin_group_read_receipts for update
  using (public.is_admin() and admin_id = auth.uid())
  with check (public.is_admin() and admin_id = auth.uid());

grant select, insert, update on public.admin_group_read_receipts to authenticated;

-- Safe to run even if already added to the realtime publication.
do $$
begin
  alter publication supabase_realtime add table public.admin_group_read_receipts;
exception when duplicate_object then
  null;
end $$;
