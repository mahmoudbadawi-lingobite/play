-- Run this ONCE to set the very first Admin account. The
-- protect_profile_privileges_trigger normally blocks role changes made
-- outside the approve_teacher()/reject_teacher() RPCs (which check
-- is_admin() themselves) - but there's no Admin yet on a brand new
-- project, so we briefly disable the trigger to bootstrap the first one.

alter table public.profiles disable trigger protect_profile_privileges_trigger;

update public.profiles
set role = 'admin', teacher_status = 'approved'
where email = 'official.mahmoudbadawi@gmail.com';

alter table public.profiles enable trigger protect_profile_privileges_trigger;
