-- Run this once to add "protected admin" support to an already-created
-- database. This stops any admin (including new ones you add later) from
-- being able to demote a protected account through the app - only you,
-- running SQL directly, can grant or revoke protection.

alter table public.profiles add column if not exists is_protected boolean not null default false;

create or replace function public.protect_profile_privileges()
returns trigger language plpgsql security definer as $$
begin
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

create or replace function public.demote_admin(target_uid uuid)
returns void language plpgsql security definer as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized';
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
