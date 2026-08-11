-- ============================================================
-- LingoBite Play - Supabase schema
-- Run this once in the Supabase SQL Editor (or via `supabase db push`).
-- Replaces the Firestore data model + firestore.rules entirely.
--
-- Order matters here: tables before the functions that query them,
-- functions before the policies that call them.
-- ============================================================

create extension if not exists pgcrypto;

-- Supabase's `anon` and `authenticated` roles need an explicit GRANT before
-- RLS policies even come into play - without this, Postgres blocks access
-- before evaluating any policy below, regardless of how permissive the
-- policy is.
grant usage on schema public to anon, authenticated;
alter default privileges in schema public grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public grant execute on functions to authenticated, anon;

-- ------------------------------------------------------------
-- profiles (one row per auth.users row - the app's "users" table)
-- ------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  photo_url text,
  role text not null default 'student' check (role in ('student', 'teacher', 'admin')),
  teacher_status text not null default 'none' check (teacher_status in ('none', 'pending', 'approved', 'rejected')),
  total_xp integer not null default 0,
  current_streak integer not null default 0,
  badges text[] not null default '{}',
  consent_given boolean not null default false,
  parent_email text,
  is_protected boolean not null default false,
  created_at timestamptz not null default now(),
  last_login_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- ------------------------------------------------------------
-- helper functions (security definer so they can read profiles
-- regardless of the caller's own RLS visibility, without recursion)
-- ------------------------------------------------------------
create or replace function public.is_admin()
returns boolean language sql stable security definer as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.is_teacher()
returns boolean language sql stable security definer as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'teacher');
$$;

create or replace function public.is_main_admin()
returns boolean language sql stable security definer as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin' and is_protected = true);
$$;

-- ------------------------------------------------------------
-- profiles: policies + privilege-protecting trigger
-- ------------------------------------------------------------
create policy "profiles: read own or admin"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

create policy "profiles: insert own default row"
  on public.profiles for insert
  with check (auth.uid() = id and role = 'student' and teacher_status = 'none');

create policy "profiles: update own or admin"
  on public.profiles for update
  using (auth.uid() = id or public.is_admin())
  with check (auth.uid() = id or public.is_admin());

create policy "profiles: teacher reads own students"
  on public.profiles for select
  using (
    exists (
      select 1 from public.class_students cs
      join public.classes c on c.id = cs.class_id
      where cs.student_id = profiles.id and c.teacher_id = auth.uid()
    )
  );

-- RLS alone can't express "you may update your own row, but not the
-- role/teacher_status columns" - that needs a trigger. A non-admin
-- self-update can only move teacher_status from 'none' to 'pending'
-- (the "request teacher access" flow); role never changes except via
-- the approve_teacher()/reject_teacher() RPCs further down.
create or replace function public.protect_profile_privileges()
returns trigger language plpgsql security definer as $$
begin
  -- is_protected can NEVER be changed through the app, by anyone, including
  -- an admin - only by directly running SQL with this trigger disabled
  -- (see supabase/bootstrap_admin.sql for the pattern). This is what keeps
  -- a compromised or malicious second admin account from being able to
  -- strip protection from the original admin before demoting them.
  new.is_protected := old.is_protected;

  if public.is_admin() then
    return new;
  end if;
  new.role := old.role;
  if old.teacher_status = 'none' and new.teacher_status = 'pending' then
    -- allowed: self-service teacher access request
  else
    new.teacher_status := old.teacher_status;
  end if;
  return new;
end;
$$;

create trigger protect_profile_privileges_trigger
  before update on public.profiles
  for each row execute function public.protect_profile_privileges();

-- auto-create a profile row whenever someone signs in for the first time
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, display_name, photo_url)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url')
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------
-- content_sets
-- ------------------------------------------------------------
create table public.content_sets (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  title_lower text not null,
  skill text not null check (skill in ('vocabulary', 'grammar', 'reading', 'spelling')),
  teacher_id uuid not null references public.profiles(id),
  teacher_name text not null,
  visibility text not null default 'public' check (visibility in ('public', 'private')),
  items jsonb not null default '[]',
  play_count integer not null default 0,
  report_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index content_sets_title_lower_idx on public.content_sets (title_lower);
create index content_sets_visibility_idx on public.content_sets (visibility);

alter table public.content_sets enable row level security;

create policy "content_sets: read public, own, or admin"
  on public.content_sets for select
  using (visibility = 'public' or teacher_id = auth.uid() or public.is_admin());

-- guests (anon role, not signed in) can browse the public library too
grant select on public.content_sets to anon;

create policy "content_sets: teacher creates own"
  on public.content_sets for insert
  with check (public.is_teacher() and teacher_id = auth.uid());

create policy "content_sets: owner or admin updates"
  on public.content_sets for update
  using (teacher_id = auth.uid() or public.is_admin());

create policy "content_sets: owner or admin deletes"
  on public.content_sets for delete
  using (teacher_id = auth.uid() or public.is_admin());

-- play_count / report_count bump via RPC (bypasses the owner-only update
-- policy above safely, instead of trying to do column-level RLS)
create or replace function public.increment_play_count(set_id uuid)
returns void language sql security definer as $$
  update public.content_sets set play_count = play_count + 1 where id = set_id;
$$;

create or replace function public.report_content_set(set_id uuid, reason text)
returns void language plpgsql security definer as $$
begin
  update public.content_sets set report_count = report_count + 1 where id = set_id;
  insert into public.content_reports (content_set_id, reason, reporter_id)
  values (set_id, reason, auth.uid());
end;
$$;

create or replace function public.unpublish_content_set(set_id uuid)
returns void language plpgsql security definer as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;
  update public.content_sets set visibility = 'private' where id = set_id;
end;
$$;

create or replace function public.republish_content_set(set_id uuid)
returns void language plpgsql security definer as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;
  update public.content_sets set visibility = 'public' where id = set_id;
end;
$$;

create or replace function public.dismiss_content_reports(set_id uuid)
returns void language plpgsql security definer as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;
  update public.content_sets set report_count = 0 where id = set_id;
end;
$$;

-- ------------------------------------------------------------
-- content_reports (admin-only read, created only via the RPC above)
-- ------------------------------------------------------------
create table public.content_reports (
  id uuid primary key default gen_random_uuid(),
  content_set_id uuid not null references public.content_sets(id) on delete cascade,
  reason text,
  reporter_id uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

alter table public.content_reports enable row level security;

create policy "content_reports: admin reads"
  on public.content_reports for select
  using (public.is_admin());

-- ------------------------------------------------------------
-- classes + class_students
-- ------------------------------------------------------------
create table public.classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  teacher_id uuid not null references public.profiles(id),
  join_code text not null unique,
  created_at timestamptz not null default now()
);

alter table public.classes enable row level security;

create policy "classes: any signed-in user can read (needed for join by code)"
  on public.classes for select
  using (auth.uid() is not null);

create policy "classes: teacher creates own"
  on public.classes for insert
  with check (public.is_teacher() and teacher_id = auth.uid());

create policy "classes: owner or admin updates"
  on public.classes for update using (teacher_id = auth.uid() or public.is_admin());

create policy "classes: owner or admin deletes"
  on public.classes for delete using (teacher_id = auth.uid() or public.is_admin());

create table public.class_students (
  class_id uuid not null references public.classes(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (class_id, student_id)
);

alter table public.class_students enable row level security;

create policy "class_students: teacher or the student themself can read"
  on public.class_students for select
  using (
    student_id = auth.uid()
    or exists (select 1 from public.classes c where c.id = class_id and c.teacher_id = auth.uid())
  );

-- joining a class happens via RPC (validates the code server-side,
-- rather than trusting a client-supplied class_id)
create or replace function public.join_class_by_code(code text)
returns public.classes language plpgsql security definer as $$
declare
  target public.classes;
begin
  select * into target from public.classes where join_code = upper(trim(code)) limit 1;
  if target.id is null then
    return null;
  end if;
  insert into public.class_students (class_id, student_id)
  values (target.id, auth.uid())
  on conflict do nothing;
  return target;
end;
$$;

-- ------------------------------------------------------------
-- game_results
-- ------------------------------------------------------------
create table public.game_results (
  id uuid primary key default gen_random_uuid(),
  content_set_id uuid references public.content_sets(id),
  content_set_title text,
  game_key text not null,
  student_id uuid not null references public.profiles(id),
  student_name text,
  class_id uuid references public.classes(id),
  xp_earned integer not null,
  accuracy integer not null,
  duration_seconds integer,
  played_at timestamptz not null default now()
);

create index game_results_class_id_idx on public.game_results (class_id);
create index game_results_game_key_idx on public.game_results (game_key);

alter table public.game_results enable row level security;

create policy "game_results: any signed-in user can read (leaderboards)"
  on public.game_results for select
  using (auth.uid() is not null);

-- recording a result + awarding XP happens atomically via RPC
create or replace function public.record_game_result(
  p_content_set_id uuid,
  p_content_set_title text,
  p_game_key text,
  p_class_id uuid,
  p_xp_earned integer,
  p_accuracy integer,
  p_duration_seconds integer
)
returns void language plpgsql security definer as $$
begin
  insert into public.game_results
    (content_set_id, content_set_title, game_key, student_id, student_name, class_id, xp_earned, accuracy, duration_seconds)
  values
    (p_content_set_id, p_content_set_title, p_game_key, auth.uid(),
     (select display_name from public.profiles where id = auth.uid()),
     p_class_id, p_xp_earned, p_accuracy, p_duration_seconds);

  update public.profiles set total_xp = total_xp + p_xp_earned where id = auth.uid();
end;
$$;

-- ------------------------------------------------------------
-- announcements (a single site-wide banner, admin-managed, shown
-- above the header to every visitor including signed-out guests)
-- text or image only - video lives in hero_media below instead,
-- since a video reads better in a large centered banner than a
-- thin top strip.
-- ------------------------------------------------------------
create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('text', 'image')),
  text_content text,
  text_color text,
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

grant select on public.announcements to anon;

-- ------------------------------------------------------------
-- hero_media (a single image/video banner shown right below the
-- header, centered, inside a rounded frame - autoplays if video)
-- ------------------------------------------------------------
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

grant select on public.hero_media to anon;

-- ------------------------------------------------------------
-- teacher approval RPCs (admin-only, checked inside the function body)
-- ------------------------------------------------------------
create or replace function public.approve_teacher(target_uid uuid)
returns void language plpgsql security definer as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;
  update public.profiles set role = 'teacher', teacher_status = 'approved' where id = target_uid;
end;
$$;

create or replace function public.reject_teacher(target_uid uuid)
returns void language plpgsql security definer as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;
  update public.profiles set teacher_status = 'rejected' where id = target_uid;
end;
$$;

-- ------------------------------------------------------------
-- Escape Room - a distinct game type, kept in its own tables since
-- it doesn't fit the universal {term, clue, imageUrl} item shape the
-- other six games share. A room is a background image with an ordered
-- set of clickable hotspots, each unlocked by answering a clue (typed
-- or multiple choice), solved strictly in sequence.
-- ------------------------------------------------------------
create table public.escape_rooms (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  title_lower text not null,
  teacher_id uuid not null references public.profiles(id),
  teacher_name text not null,
  image_url text not null,
  story_text text,
  theme text,
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

grant select on public.escape_rooms to anon;

create table public.escape_room_hotspots (
  id uuid primary key default gen_random_uuid(),
  escape_room_id uuid not null references public.escape_rooms(id) on delete cascade,
  order_index integer not null,
  x_percent numeric not null,
  y_percent numeric not null,
  radius_percent numeric not null default 8,
  locate_hint text not null default '',
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

grant select on public.escape_room_hotspots to anon;

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

-- Records a completed escape room and awards XP atomically.
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

-- ------------------------------------------------------------
-- Admin management - promote/demote other accounts to Admin.
-- Both check is_admin() themselves, and since the caller must
-- already be an admin, the protect_profile_privileges_trigger
-- lets the role change through (it only blocks non-admin callers).
-- ------------------------------------------------------------
create or replace function public.promote_to_admin(target_uid uuid)
returns void language plpgsql security definer as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;
  update public.profiles set role = 'admin' where id = target_uid;
end;
$$;

create or replace function public.demote_admin(target_uid uuid)
returns void language plpgsql security definer as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;
  if not public.is_main_admin() then
    raise exception 'only the main admin can remove admin access';
  end if;
  if target_uid = auth.uid() then
    raise exception 'cannot remove your own admin access';
  end if;
  if (select is_protected from public.profiles where id = target_uid) then
    raise exception 'this account is protected and cannot be demoted';
  end if;
  update public.profiles set role = 'student' where id = target_uid;
end;
$$;

-- ------------------------------------------------------------
-- Admin chat - a shared group thread all admins see, plus 1:1 DMs
-- between specific admins. Admin-only in every direction; no other
-- role can read or send these messages.
-- ------------------------------------------------------------
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
  read_at timestamptz,
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

create policy "admin_direct_messages: recipient marks read"
  on public.admin_direct_messages for update
  using (public.is_admin() and recipient_id = auth.uid())
  with check (public.is_admin() and recipient_id = auth.uid());

create policy "admin_direct_messages: participants can clear"
  on public.admin_direct_messages for delete
  using (public.is_admin() and (sender_id = auth.uid() or recipient_id = auth.uid()));

grant select, insert, update, delete on public.admin_direct_messages to authenticated;

-- enable realtime on profiles too, so the pending-teacher-request bell
-- updates live without polling (admin already sees every profile row
-- per RLS, so this only ever reaches admin sessions)
alter publication supabase_realtime add table public.profiles;

-- Clearing the group chat is main-admin only. Deliberately no DELETE
-- policy exists on admin_group_messages, so this security-definer
-- function is the *only* way any row in it can ever be removed.
create or replace function public.clear_group_chat()
returns void language plpgsql security definer as $$
begin
  if not public.is_main_admin() then
    raise exception 'only the main admin can clear the group chat';
  end if;
  delete from public.admin_group_messages;
end;
$$;

-- enable realtime so messages appear instantly without polling
alter publication supabase_realtime add table public.admin_group_messages;
alter publication supabase_realtime add table public.admin_direct_messages;
