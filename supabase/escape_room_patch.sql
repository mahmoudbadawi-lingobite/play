-- Run this once to add the Escape Room feature to an already-created database.

create table public.escape_rooms (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  title_lower text not null,
  teacher_id uuid not null references public.profiles(id),
  teacher_name text not null,
  image_url text not null,
  visibility text not null default 'public' check (visibility in ('public', 'private')),
  play_count integer not null default 0,
  report_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index escape_rooms_title_lower_idx on public.escape_rooms (title_lower);
create index escape_rooms_visibility_idx on public.escape_rooms (visibility);

alter table public.escape_rooms enable row level security;

create policy "escape_rooms: read public, own, or admin"
  on public.escape_rooms for select
  using (visibility = 'public' or teacher_id = auth.uid() or public.is_admin());

create policy "escape_rooms: teacher creates own"
  on public.escape_rooms for insert
  with check (public.is_teacher() and teacher_id = auth.uid());

create policy "escape_rooms: owner or admin updates"
  on public.escape_rooms for update
  using (teacher_id = auth.uid() or public.is_admin());

create policy "escape_rooms: owner or admin deletes"
  on public.escape_rooms for delete
  using (teacher_id = auth.uid() or public.is_admin());

grant select, insert, update, delete on public.escape_rooms to authenticated;
grant select on public.escape_rooms to anon;

create table public.escape_room_hotspots (
  id uuid primary key default gen_random_uuid(),
  escape_room_id uuid not null references public.escape_rooms(id) on delete cascade,
  order_index integer not null,
  x_percent numeric not null,
  y_percent numeric not null,
  radius_percent numeric not null default 8,
  clue_text text not null,
  answer_mode text not null check (answer_mode in ('type', 'choice')),
  correct_answer text not null,
  choices jsonb
);

create index escape_room_hotspots_room_idx on public.escape_room_hotspots (escape_room_id, order_index);

alter table public.escape_room_hotspots enable row level security;

create policy "escape_room_hotspots: read if parent room readable"
  on public.escape_room_hotspots for select
  using (
    exists (
      select 1 from public.escape_rooms r
      where r.id = escape_room_id
        and (r.visibility = 'public' or r.teacher_id = auth.uid() or public.is_admin())
    )
  );

create policy "escape_room_hotspots: owner or admin writes"
  on public.escape_room_hotspots for all
  using (
    exists (
      select 1 from public.escape_rooms r
      where r.id = escape_room_id and (r.teacher_id = auth.uid() or public.is_admin())
    )
  )
  with check (
    exists (
      select 1 from public.escape_rooms r
      where r.id = escape_room_id and (r.teacher_id = auth.uid() or public.is_admin())
    )
  );

grant select, insert, update, delete on public.escape_room_hotspots to authenticated;
grant select on public.escape_room_hotspots to anon;

create table public.escape_room_reports (
  id uuid primary key default gen_random_uuid(),
  escape_room_id uuid not null references public.escape_rooms(id) on delete cascade,
  reason text,
  reporter_id uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

alter table public.escape_room_reports enable row level security;

create policy "escape_room_reports: admin reads"
  on public.escape_room_reports for select
  using (public.is_admin());

grant select, insert on public.escape_room_reports to authenticated;

create table public.escape_room_results (
  id uuid primary key default gen_random_uuid(),
  escape_room_id uuid references public.escape_rooms(id),
  escape_room_title text,
  student_id uuid not null references public.profiles(id),
  student_name text,
  wrong_clicks integer not null default 0,
  duration_seconds integer,
  xp_earned integer not null,
  played_at timestamptz not null default now()
);

alter table public.escape_room_results enable row level security;

create policy "escape_room_results: any signed-in user can read"
  on public.escape_room_results for select
  using (auth.uid() is not null);

grant select, insert on public.escape_room_results to authenticated;

create or replace function public.increment_escape_room_play_count(room_id uuid)
returns void language sql security definer as $$
  update public.escape_rooms set play_count = play_count + 1 where id = room_id;
$$;

create or replace function public.report_escape_room(room_id uuid, reason text)
returns void language plpgsql security definer as $$
begin
  update public.escape_rooms set report_count = report_count + 1 where id = room_id;
  insert into public.escape_room_reports (escape_room_id, reason, reporter_id)
  values (room_id, reason, auth.uid());
end;
$$;

create or replace function public.unpublish_escape_room(room_id uuid)
returns void language plpgsql security definer as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;
  update public.escape_rooms set visibility = 'private' where id = room_id;
end;
$$;

create or replace function public.republish_escape_room(room_id uuid)
returns void language plpgsql security definer as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;
  update public.escape_rooms set visibility = 'public' where id = room_id;
end;
$$;

create or replace function public.dismiss_escape_room_reports(room_id uuid)
returns void language plpgsql security definer as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;
  update public.escape_rooms set report_count = 0 where id = room_id;
end;
$$;

create or replace function public.record_escape_room_result(
  p_room_id uuid,
  p_room_title text,
  p_wrong_clicks integer,
  p_duration_seconds integer,
  p_xp_earned integer
)
returns void language plpgsql security definer as $$
begin
  insert into public.escape_room_results
    (escape_room_id, escape_room_title, student_id, student_name, wrong_clicks, duration_seconds, xp_earned)
  values
    (p_room_id, p_room_title, auth.uid(),
     (select display_name from public.profiles where id = auth.uid()),
     p_wrong_clicks, p_duration_seconds, p_xp_earned);

  update public.profiles set total_xp = total_xp + p_xp_earned where id = auth.uid();
end;
$$;
