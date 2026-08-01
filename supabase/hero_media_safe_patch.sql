-- Idempotent - safe to run even if some of this already exists.

create table if not exists public.hero_media (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('image', 'video')),
  media_url text not null,
  is_active boolean not null default true,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.hero_media enable row level security;

drop policy if exists "hero_media: anyone can read active ones" on public.hero_media;
create policy "hero_media: anyone can read active ones"
  on public.hero_media for select
  using (is_active = true or public.is_admin());

drop policy if exists "hero_media: admin manages" on public.hero_media;
create policy "hero_media: admin manages"
  on public.hero_media for all
  using (public.is_admin())
  with check (public.is_admin());

grant select, insert, update, delete on public.hero_media to authenticated;
grant select on public.hero_media to anon;
