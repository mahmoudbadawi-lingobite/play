-- Run this once, after the patch above, to protect your own account.
-- Swap in your actual email. This is the only way to set is_protected -
-- the app itself can never do this, by design.

alter table public.profiles disable trigger protect_profile_privileges_trigger;

update public.profiles
set is_protected = true
where email = 'official.mahmoudbadawi@gmail.com';

alter table public.profiles enable trigger protect_profile_privileges_trigger;
