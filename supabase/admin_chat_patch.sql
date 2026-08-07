-- Run this once to add the Admin Chat feature to an already-created database.

create table public.admin_group_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id),
  sender_name text not null,
  content text not null,
  created_at timestamptz not null default now()
);

create index admin_group_messages_created_idx on public.admin_group_messages (created_at);

alter table public.admin_group_messages enable row level security;

create policy "admin_group_messages: admins read"
  on public.admin_group_messages for select
  using (public.is_admin());

create policy "admin_group_messages: admins send"
  on public.admin_group_messages for insert
  with check (public.is_admin() and sender_id = auth.uid());

grant select, insert on public.admin_group_messages to authenticated;

create table public.admin_direct_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id),
  recipient_id uuid not null references public.profiles(id),
  content text not null,
  created_at timestamptz not null default now()
);

create index admin_direct_messages_pair_idx on public.admin_direct_messages (sender_id, recipient_id, created_at);

alter table public.admin_direct_messages enable row level security;

create policy "admin_direct_messages: participants read"
  on public.admin_direct_messages for select
  using (public.is_admin() and (sender_id = auth.uid() or recipient_id = auth.uid()));

create policy "admin_direct_messages: admin sends to admin"
  on public.admin_direct_messages for insert
  with check (
    public.is_admin()
    and sender_id = auth.uid()
    and exists (select 1 from public.profiles p where p.id = recipient_id and p.role = 'admin')
  );

grant select, insert on public.admin_direct_messages to authenticated;

alter publication supabase_realtime add table public.admin_group_messages;
alter publication supabase_realtime add table public.admin_direct_messages;
