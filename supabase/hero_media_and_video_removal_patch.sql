-- Run this once to:
--  1. Remove 'video' as a valid announcement type (text/image only now)
--  2. Add the new hero_media table for the video/photo banner under the header

-- Deactivate any existing video announcement (it would now violate the
-- tightened constraint below)
update public.announcements set is_active = false where type = 'video';

alter table public.announcements drop constraint if exists announcements_type_check;
alter table public.announcements add constraint announcements_type_check
  check (type in ('text', 'image'));

create table public.hero_media (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('image', 'video')),
  media_url text not null,
  is_active boolean not null default true,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.hero_media enable row level security;

create policy "hero_media: anyone can read active ones"
  on public.hero_media for select
  using (is_active = true or public.is_admin());

create policy "hero_media: admin manages"
  on public.hero_media for all
  using (public.is_admin())
  with check (public.is_admin());

grant select, insert, update, delete on public.hero_media to authenticated;
grant select on public.hero_media to anon;
