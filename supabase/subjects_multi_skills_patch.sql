-- Several skills (and domains) per question and per game.
-- Run AFTER subjects_skills_patch.sql. Safe to re-run.
-- The single skill_id / domain_id columns stay: they hold the FIRST chosen skill/domain, so older screens and reports keep working.

alter table public.mq_questions add column if not exists domain_ids text[] not null default '{}';
alter table public.mq_questions add column if not exists skill_ids  text[] not null default '{}';
alter table public.content_sets add column if not exists domain_ids text[] not null default '{}';
alter table public.content_sets add column if not exists skill_ids  text[] not null default '{}';

create index if not exists mq_questions_skill_ids_idx on public.mq_questions using gin (skill_ids);
create index if not exists content_sets_skill_ids_idx on public.content_sets using gin (skill_ids);

-- keep the arrays and the single columns in step, and check every id belongs to the chosen subject
create or replace function public.trg_multi_subject_tags()
returns trigger language plpgsql security definer set search_path = public as $$
declare bad int;
begin
  -- a client that only knows the single columns: promote them to arrays
  if coalesce(array_length(new.skill_ids, 1), 0) = 0 and new.skill_id is not null then new.skill_ids := array[new.skill_id]; end if;
  if coalesce(array_length(new.domain_ids, 1), 0) = 0 and new.domain_id is not null then new.domain_ids := array[new.domain_id]; end if;

  if new.subject_id is null then
    new.skill_ids := '{}'; new.domain_ids := '{}';
    return new;
  end if;

  if coalesce(array_length(new.skill_ids, 1), 0) > 0 then
    select count(*) into bad from unnest(new.skill_ids) s(id)
      where not exists (select 1 from public.subject_skills k where k.id = s.id and k.subject_id = new.subject_id);
    if bad > 0 then raise exception 'one of the chosen skills does not belong to the chosen subject'; end if;
    -- domains always include the domains of the chosen skills
    new.domain_ids := (select coalesce(array_agg(distinct d), '{}') from unnest(new.domain_ids || array(select k.domain_id from public.subject_skills k where k.id = any (new.skill_ids))) u(d));
  end if;
  if coalesce(array_length(new.domain_ids, 1), 0) > 0 then
    select count(*) into bad from unnest(new.domain_ids) s(id)
      where not exists (select 1 from public.subject_domains d where d.id = s.id and d.subject_id = new.subject_id);
    if bad > 0 then raise exception 'one of the chosen domains does not belong to the chosen subject'; end if;
  end if;

  new.skill_id  := new.skill_ids[1];
  new.domain_id := coalesce((select k.domain_id from public.subject_skills k where k.id = new.skill_ids[1]), new.domain_ids[1]);
  return new;
end;
$$;

drop trigger if exists subject_multi_tags on public.mq_questions;
create trigger subject_multi_tags before insert or update on public.mq_questions
  for each row execute function public.trg_multi_subject_tags();
drop trigger if exists subject_multi_tags on public.content_sets;
create trigger subject_multi_tags before insert or update on public.content_sets
  for each row execute function public.trg_multi_subject_tags();

-- existing rows
update public.mq_questions  set skill_ids = array[skill_id]   where skill_id  is not null and coalesce(array_length(skill_ids, 1), 0) = 0;
update public.mq_questions  set domain_ids = array[domain_id] where domain_id is not null and coalesce(array_length(domain_ids, 1), 0) = 0;
update public.content_sets  set skill_ids = array[skill_id]   where skill_id  is not null and coalesce(array_length(skill_ids, 1), 0) = 0;
update public.content_sets  set domain_ids = array[domain_id] where domain_id is not null and coalesce(array_length(domain_ids, 1), 0) = 0;
