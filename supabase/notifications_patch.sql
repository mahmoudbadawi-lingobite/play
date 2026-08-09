-- Run this once to add DM read-tracking and live notifications to an
-- already-created database.

alter table public.admin_direct_messages add column if not exists read_at timestamptz;

drop policy if exists "admin_direct_messages: recipient marks read" on public.admin_direct_messages;
create policy "admin_direct_messages: recipient marks read"
  on public.admin_direct_messages for update
  using (public.is_admin() and recipient_id = auth.uid())
  with check (public.is_admin() and recipient_id = auth.uid());

grant update on public.admin_direct_messages to authenticated;

alter publication supabase_realtime add table public.profiles;
