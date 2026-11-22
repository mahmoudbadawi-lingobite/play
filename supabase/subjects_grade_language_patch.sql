-- =====================================================================
-- Grade (1-12) on questions and content, a language per subject, and sub-subjects.
-- Run AFTER subjects_skills_patch.sql (and subjects_multi_skills_patch.sql). Safe to re-run.
-- =====================================================================

-- language of a subject: drives the voice that reads listening audio and the language of the AI prompts
alter table public.subjects add column if not exists language text not null default 'en' check (language in ('en', 'ar'));
-- e.g. Physics, Chemistry and Biology can sit under Science (used by the Content Library cards later)
alter table public.subjects add column if not exists parent_id text references public.subjects(id) on delete set null;

-- grade 1-12 (empty = any grade)
alter table public.mq_questions add column if not exists grade smallint check (grade between 1 and 12);
alter table public.content_sets add column if not exists grade smallint check (grade between 1 and 12);
create index if not exists mq_questions_grade_idx on public.mq_questions (grade);
create index if not exists content_sets_grade_idx on public.content_sets (grade);

update public.subjects set language = 'en' where id = 'english';
