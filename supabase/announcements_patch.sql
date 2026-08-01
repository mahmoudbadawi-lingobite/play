-- Run this once if your database was created before the announcements
-- feature existed.

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('text', 'image', 'video')),
  text_content text,
  media_url text,
  is_active boolean not null default true,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.announcements enable row level security;

create policy "announcements: anyone can read active ones"
  on public.announcements for select
  using (is_active = true or public.is_admin());

create policy "announcements: admin manages"
  on public.announcements for all
  using (public.is_admin())
  with check (public.is_admin());

grant select, insert, update, delete on public.announcements to authenticated;
grant select on public.announcements to anon;
