-- Run this once if you already ran schema.sql before the grants fix and are
-- seeing "permission denied for table X" errors. This adds the missing
-- grants to tables/functions that already exist, without needing to drop
-- and recreate anything.

grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on
  public.profiles,
  public.content_sets,
  public.content_reports,
  public.classes,
  public.class_students,
  public.game_results
to authenticated;

grant select on public.content_sets to anon;

grant execute on all functions in schema public to authenticated, anon;
