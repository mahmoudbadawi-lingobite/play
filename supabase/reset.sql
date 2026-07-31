-- Run this once if schema.sql errors with "already exists" - wipes any
-- partially-applied LingoBite Play schema so schema.sql can run clean.

drop trigger if exists on_auth_user_created on auth.users;

drop table if exists public.content_reports cascade;
drop table if exists public.game_results cascade;
drop table if exists public.class_students cascade;
drop table if exists public.classes cascade;
drop table if exists public.content_sets cascade;
drop table if exists public.profiles cascade;

drop function if exists public.handle_new_user() cascade;
drop function if exists public.protect_profile_privileges() cascade;
drop function if exists public.is_admin() cascade;
drop function if exists public.is_teacher() cascade;
drop function if exists public.increment_play_count(uuid) cascade;
drop function if exists public.report_content_set(uuid, text) cascade;
drop function if exists public.unpublish_content_set(uuid) cascade;
drop function if exists public.dismiss_content_reports(uuid) cascade;
drop function if exists public.join_class_by_code(text) cascade;
drop function if exists public.record_game_result(uuid, text, text, uuid, integer, integer, integer) cascade;
drop function if exists public.approve_teacher(uuid) cascade;
drop function if exists public.reject_teacher(uuid) cascade;
