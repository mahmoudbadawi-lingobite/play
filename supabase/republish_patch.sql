-- Run this once if your database was created before this function existed.
create or replace function public.republish_content_set(set_id uuid)
returns void language plpgsql security definer as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;
  update public.content_sets set visibility = 'public' where id = set_id;
end;
$$;
