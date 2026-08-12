-- Run this once in the Supabase SQL editor to fix two bugs:
--
-- 1. Deleting an escape room silently failed (409 Conflict) once it had
--    been played at least once. escape_room_results referenced
--    escape_rooms WITHOUT "on delete cascade", so Postgres blocked the
--    delete with a foreign-key violation. This makes the room's play
--    history get cleaned up along with the room, same as its hotspots
--    and reports already do.
--
-- 2. "Clear chat" on the Admin Group Chat failed with
--    "DELETE requires a WHERE clause" - your project has a delete-safety
--    guard that blocks unqualified deletes, even inside a function. This
--    adds a harmless "where true" so it still deletes every row.

alter table public.escape_room_results
  drop constraint if exists escape_room_results_escape_room_id_fkey;

alter table public.escape_room_results
  add constraint escape_room_results_escape_room_id_fkey
  foreign key (escape_room_id) references public.escape_rooms(id) on delete cascade;

create or replace function public.clear_group_chat()
returns void language plpgsql security definer as $$
begin
  if not public.is_main_admin() then
    raise exception 'only the main admin can clear the group chat';
  end if;
  delete from public.admin_group_messages where true;
end;
$$;
