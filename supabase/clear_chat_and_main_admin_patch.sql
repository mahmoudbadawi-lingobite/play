-- Run this once to add:
--  1. "Clear chat" - either DM participant can clear that conversation for
--     both sides; only the main (protected) admin can clear the group chat
--  2. Restrict admin removal to the main admin only

create or replace function public.is_main_admin()
returns boolean language sql stable security definer as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin' and is_protected = true);
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

drop policy if exists "admin_direct_messages: participants can clear" on public.admin_direct_messages;
create policy "admin_direct_messages: participants can clear"
  on public.admin_direct_messages for delete
  using (public.is_admin() and (sender_id = auth.uid() or recipient_id = auth.uid()));

grant delete on public.admin_direct_messages to authenticated;

create or replace function public.clear_group_chat()
returns void language plpgsql security definer as $$
begin
  if not public.is_main_admin() then
    raise exception 'only the main admin can clear the group chat';
  end if;
  delete from public.admin_group_messages;
end;
$$;
