-- ==========================================================================
-- Style Store: items created by admins (Store Admin page)
-- Run this ONCE in the Supabase SQL editor. It is safe to run again.
-- ==========================================================================

create table if not exists public.store_items (
  id          text primary key,
  name        text not null,
  slot        text not null,                       -- outfit, hat, hair, accessory, shoes, backpack, pet, character or set
  category    text,
  gender      text not null default 'unisex' check (gender in ('boy', 'girl', 'unisex')),
  price       integer not null default 0 check (price >= 0 and price <= 99999),
  rarity      text not null default 'common' check (rarity in ('common', 'rare', 'epic')),
  blurb       text,
  spec        jsonb not null default '{}'::jsonb,  -- style, colours, optional 3D model link
  hidden      boolean not null default false,
  pieces      text[],                              -- sets: ids of the items inside the set
  active      boolean not null default true,       -- false = hidden from students
  created_by  uuid references public.profiles(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.store_items enable row level security;

-- everybody (including guests) can read active items; admins can read all
drop policy if exists "store_items: read" on public.store_items;
create policy "store_items: read" on public.store_items
  for select using (active or public.is_admin());

-- only admins can add, change or delete items
drop policy if exists "store_items: admin insert" on public.store_items;
create policy "store_items: admin insert" on public.store_items
  for insert with check (public.is_admin());

drop policy if exists "store_items: admin update" on public.store_items;
create policy "store_items: admin update" on public.store_items
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "store_items: admin delete" on public.store_items;
create policy "store_items: admin delete" on public.store_items
  for delete using (public.is_admin());

grant select on public.store_items to anon, authenticated;
grant insert, update, delete on public.store_items to authenticated;
