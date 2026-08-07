-- Run this once to add admin promotion/demotion to an already-created database.

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
  if target_uid = auth.uid() then
    raise exception 'cannot remove your own admin access';
  end if;
  update public.profiles set role = 'student' where id = target_uid;
end;
$$;
