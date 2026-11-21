-- =====================================================================
-- SUBJECTS, SKILLS AND TEACHER LINKS  (whole web app)
-- Run once in the Supabase SQL editor (safe to re-run).
-- Needs: schema.sql, monster_quest_patch.sql (mq_questions). Run monster_quest_teacher_stage1.sql first if you use it.
--
-- What it does
--  1. subjects > domains > skills (sub-skills), editable by admins. English is seeded from your taxonomy file.
--  2. question_types + subject_question_types: which question types each subject allows.
--  3. teacher_subjects: a teacher asks for a subject (pending), an admin approves or rejects.
--  4. mq_questions and content_sets get subject_id / domain_id / skill_id (+ cognitive_level on questions).
--     Existing rows are tagged English, and existing approved teachers get English approved.
--  5. Triggers enforce it on the server: a teacher can only save content for an approved subject,
--     the skill must belong to that subject, and (Monster Quest questions) the type must be allowed for it.
--     Admins are not restricted. If a subject has no allowed types configured yet, every type is allowed.
-- =====================================================================
begin;

create table if not exists public.question_types (
  id text primary key,
  label text not null,
  sort int not null default 0
);
insert into public.question_types (id, label, sort) values
  ('mcq', 'Multiple choice', 1), ('true_false', 'True / false', 2), ('fill_blank', 'Fill in the blank', 3),
  ('spelling', 'Spelling (listen & type)', 4), ('type_answer', 'Type the answer', 5), ('listening', 'Listening (audio + choices)', 6),
  ('reading', 'Reading comprehension', 7), ('sentence_order', 'Sentence ordering', 8), ('word_match', 'Word matching', 9)
on conflict (id) do nothing;

create table if not exists public.subjects (
  id text primary key check (id ~ '^[a-z0-9_-]+$'),
  name text not null,
  icon text,
  sort int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create table if not exists public.subject_domains (
  id text primary key check (id ~ '^[a-z0-9_.-]+$'),
  subject_id text not null references public.subjects(id) on delete cascade,
  name text not null,
  sort int not null default 0
);
create table if not exists public.subject_skills (
  id text primary key check (id ~ '^[a-z0-9_.-]+$'),
  domain_id text not null references public.subject_domains(id) on delete cascade,
  subject_id text not null references public.subjects(id) on delete cascade,
  name text not null,
  description text,
  sort int not null default 0,
  active boolean not null default true
);
create index if not exists subject_skills_subject_idx on public.subject_skills (subject_id, domain_id);
create table if not exists public.subject_question_types (
  subject_id text not null references public.subjects(id) on delete cascade,
  question_type text not null references public.question_types(id) on delete cascade,
  primary key (subject_id, question_type)
);
create table if not exists public.teacher_subjects (
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  subject_id text not null references public.subjects(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  requested_at timestamptz not null default now(),
  decided_by uuid references public.profiles(id) on delete set null,
  decided_at timestamptz,
  primary key (teacher_id, subject_id)
);

-- ------------------------------------------------------------ tag columns
alter table public.mq_questions add column if not exists subject_id text references public.subjects(id) on delete set null;
alter table public.mq_questions add column if not exists domain_id text references public.subject_domains(id) on delete set null;
alter table public.mq_questions add column if not exists skill_id text references public.subject_skills(id) on delete set null;
alter table public.mq_questions add column if not exists cognitive_level text check (cognitive_level in ('recall', 'application', 'analysis', 'synthesis'));
alter table public.content_sets add column if not exists subject_id text references public.subjects(id) on delete set null;
alter table public.content_sets add column if not exists domain_id text references public.subject_domains(id) on delete set null;
alter table public.content_sets add column if not exists skill_id text references public.subject_skills(id) on delete set null;
create index if not exists mq_questions_subject_idx on public.mq_questions (subject_id, skill_id);
create index if not exists content_sets_subject_idx on public.content_sets (subject_id, skill_id);

-- ------------------------------------------------------------------ RLS
alter table public.question_types enable row level security;
alter table public.subjects enable row level security;
alter table public.subject_domains enable row level security;
alter table public.subject_skills enable row level security;
alter table public.subject_question_types enable row level security;
alter table public.teacher_subjects enable row level security;

do $$ declare t text; begin
  foreach t in array array['question_types', 'subjects', 'subject_domains', 'subject_skills', 'subject_question_types'] loop
    execute format('drop policy if exists "%1$s: read" on public.%1$s', t);
    execute format('create policy "%1$s: read" on public.%1$s for select using (true)', t);
    execute format('drop policy if exists "%1$s: admin writes" on public.%1$s', t);
    execute format('create policy "%1$s: admin writes" on public.%1$s for all using (public.is_admin()) with check (public.is_admin())', t);
    execute format('grant select on public.%1$s to anon, authenticated', t);
    execute format('grant insert, update, delete on public.%1$s to authenticated', t);
  end loop;
end $$;

drop policy if exists "teacher_subjects: own or admin read" on public.teacher_subjects;
create policy "teacher_subjects: own or admin read" on public.teacher_subjects for select using (teacher_id = auth.uid() or public.is_admin());
drop policy if exists "teacher_subjects: teacher requests" on public.teacher_subjects;
create policy "teacher_subjects: teacher requests" on public.teacher_subjects for insert
  with check (teacher_id = auth.uid() and status = 'pending' and public.is_teacher());
drop policy if exists "teacher_subjects: teacher withdraws" on public.teacher_subjects;
create policy "teacher_subjects: teacher withdraws" on public.teacher_subjects for delete using (teacher_id = auth.uid());
drop policy if exists "teacher_subjects: admin all" on public.teacher_subjects;
create policy "teacher_subjects: admin all" on public.teacher_subjects for all using (public.is_admin()) with check (public.is_admin());
grant select, insert, update, delete on public.teacher_subjects to authenticated;

-- ------------------------------------------------------- server-side rules
-- Is the signed-in user an approved teacher of this subject?
create or replace function public.is_subject_teacher(p_subject text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.teacher_subjects where teacher_id = auth.uid() and subject_id = p_subject and status = 'approved');
$$;

-- tags must agree with each other (skill inside domain inside subject)
create or replace function public.check_subject_tags(p_subject text, p_domain text, p_skill text)
returns void language plpgsql stable security definer set search_path = public as $$
begin
  if p_skill is not null then
    if not exists (select 1 from public.subject_skills where id = p_skill and subject_id = p_subject and (p_domain is null or domain_id = p_domain)) then
      raise exception 'that skill does not belong to the chosen subject';
    end if;
  elsif p_domain is not null then
    if not exists (select 1 from public.subject_domains where id = p_domain and subject_id = p_subject) then
      raise exception 'that domain does not belong to the chosen subject';
    end if;
  end if;
end;
$$;

create or replace function public.trg_mq_question_subject()
returns trigger language plpgsql security definer set search_path = public as $$
declare changed boolean;
begin
  if new.subject_id is not null then
    perform public.check_subject_tags(new.subject_id, new.domain_id, new.skill_id);
    -- keep the old free-text column in step so reports keep working
    new.subject := (select name from public.subjects where id = new.subject_id);
  end if;
  if auth.uid() is null or public.is_admin() then return new; end if;
  changed := tg_op = 'INSERT' or new.subject_id is distinct from old.subject_id or new.type is distinct from old.type
             or new.skill_id is distinct from old.skill_id;
  if not changed then return new; end if;
  if new.subject_id is null then raise exception 'choose a subject for this question'; end if;
  if not public.is_subject_teacher(new.subject_id) then raise exception 'you are not approved to teach this subject'; end if;
  if exists (select 1 from public.subject_question_types where subject_id = new.subject_id)
     and not exists (select 1 from public.subject_question_types where subject_id = new.subject_id and question_type = new.type) then
    raise exception 'this question type is not available for the subject';
  end if;
  return new;
end;
$$;
drop trigger if exists mq_question_subject on public.mq_questions;
create trigger mq_question_subject before insert or update on public.mq_questions
  for each row execute function public.trg_mq_question_subject();

create or replace function public.trg_content_set_subject()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.subject_id is not null then perform public.check_subject_tags(new.subject_id, new.domain_id, new.skill_id); end if;
  if auth.uid() is null or public.is_admin() then return new; end if;
  if tg_op = 'INSERT' or new.subject_id is distinct from old.subject_id or new.skill_id is distinct from old.skill_id then
    if new.subject_id is null then raise exception 'choose a subject'; end if;
    if not public.is_subject_teacher(new.subject_id) then raise exception 'you are not approved to teach this subject'; end if;
  end if;
  return new;
end;
$$;
drop trigger if exists content_set_subject on public.content_sets;
create trigger content_set_subject before insert or update on public.content_sets
  for each row execute function public.trg_content_set_subject();

-- when an admin decides, record who and when
create or replace function public.trg_teacher_subject_decision()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'UPDATE' and new.status is distinct from old.status then
    new.decided_by := auth.uid(); new.decided_at := now();
  end if;
  return new;
end;
$$;
drop trigger if exists teacher_subject_decision on public.teacher_subjects;
create trigger teacher_subject_decision before update on public.teacher_subjects
  for each row execute function public.trg_teacher_subject_decision();

-- ----------------------------------------------------------------- seed
-- English taxonomy (from english_language_assessment_skill_taxonomy.md): 6 domains, 42 skills
insert into public.subjects (id, name, icon, sort) values ('english', 'English', '📘', 1) on conflict (id) do nothing;
insert into public.subject_domains (id, subject_id, name, sort) values
  ('english.reading', 'english', 'Reading', 1),
  ('english.listening', 'english', 'Listening', 2),
  ('english.vocabulary', 'english', 'Vocabulary', 3),
  ('english.grammar', 'english', 'Grammar', 4),
  ('english.writing', 'english', 'Writing', 5),
  ('english.speaking', 'english', 'Speaking', 6)
on conflict (id) do nothing;
insert into public.subject_skills (id, domain_id, subject_id, name, description, sort) values
  ('english.reading.literal-comprehension-explicit-detail', 'english.reading', 'english', 'Literal Comprehension (Explicit Detail)', 'Locating directly stated facts, names, dates, or events.', 1),
  ('english.reading.skimming-gist-main-idea', 'english.reading', 'english', 'Skimming (Gist & Main Idea)', 'Identifying the central theme, topic sentence, or overall purpose of a paragraph or passage.', 2),
  ('english.reading.scanning-specific-information', 'english.reading', 'english', 'Scanning (Specific Information)', 'Rapidly locating key terms, numbers, definitions, or answers to targeted questions.', 3),
  ('english.reading.lexical-inference-context-clues', 'english.reading', 'english', 'Lexical Inference (Context Clues)', 'Deducing the meaning of unfamiliar words or idioms from surrounding syntax and semantics.', 4),
  ('english.reading.propositional-situational-inference', 'english.reading', 'english', 'Propositional / Situational Inference', 'Reading between the lines to determine implied attitudes, unstated causes, or logical conclusions.', 5),
  ('english.reading.text-structure-discourse-markers', 'english.reading', 'english', 'Text Structure & Discourse Markers', 'Recognizing cause-and-effect, contrast, comparison, chronology, problem-solution, and transition signals (*however, consequently, whereas*).', 6),
  ('english.reading.cohesion-reference-tracking', 'english.reading', 'english', 'Cohesion & Reference Tracking', 'Identifying what pronouns (*it, they, which*), demonstratives, or substitution phrases refer back to.', 7),
  ('english.reading.author-s-purpose-tone-attitude', 'english.reading', 'english', 'Author''s Purpose, Tone & Attitude', 'Judging whether a passage aims to persuade, inform, critique, or entertain, and identifying tones (ironic, objective, urgent, skeptical).', 8),
  ('english.reading.fact-vs-opinion-bias-detection', 'english.reading', 'english', 'Fact vs. Opinion & Bias Detection', 'Distinguishing verifiable claims from value judgments, assumptions, or persuasive framing.', 9),
  ('english.reading.summarizing-paraphrasing', 'english.reading', 'english', 'Summarizing & Paraphrasing', 'Selecting accurate condensed restatements of key ideas without distorting meaning.', 10),
  ('english.listening.phonemic-word-recognition', 'english.listening', 'english', 'Phonemic & Word Recognition', 'Distinguishing minimal pairs or spotting target vocabulary in continuous speech.', 1),
  ('english.listening.connected-speech-prosody-decoding', 'english.listening', 'english', 'Connected Speech & Prosody Decoding', 'Interpreting reductions, linking, elision (*gonna, didja*), stress shifts, and intonation contours (question vs. statement vs. sarcasm).', 2),
  ('english.listening.gist-speaker-intent', 'english.listening', 'english', 'Gist & Speaker Intent', 'Capturing the main point of a monologue, lecture, or dialogue.', 3),
  ('english.listening.specific-detail-numerical-capture', 'english.listening', 'english', 'Specific Detail & Numerical Capture', 'Catching dates, times, prices, spellings, directions, or measurements.', 4),
  ('english.listening.speaker-attitude-emotion-stance', 'english.listening', 'english', 'Speaker Attitude, Emotion & Stance', 'Detecting hesitation, agreement, disagreement, surprise, or certainty from vocal cues.', 5),
  ('english.listening.turn-taking-pragmatic-function', 'english.listening', 'english', 'Turn-Taking & Pragmatic Function', 'Identifying why a speaker says something (e.g., *making a request, declining an offer, hedging, shifting topic*).', 6),
  ('english.listening.lecture-note-taking-synthesis', 'english.listening', 'english', 'Lecture / Note-Taking Synthesis', 'Mapping spoken arguments onto outlines, tables, or cause-and-effect chains.', 7),
  ('english.vocabulary.denotation-definition-matching', 'english.vocabulary', 'english', 'Denotation & Definition Matching', 'Selecting exact meanings in context.', 1),
  ('english.vocabulary.synonyms-antonyms-semantic-nuance', 'english.vocabulary', 'english', 'Synonyms, Antonyms & Semantic Nuance', 'Distinguishing near-synonyms by intensity or connotation (e.g., *frugal vs. stingy*, *ask vs. demand*).', 2),
  ('english.vocabulary.collocations', 'english.vocabulary', 'english', 'Collocations', 'Completing natural word pairings (e.g., *heavy rain, take a risk, conduct research*).', 3),
  ('english.vocabulary.idioms-phrasal-verbs-figurative-language', 'english.vocabulary', 'english', 'Idioms, Phrasal Verbs & Figurative Language', 'Interpreting multi-word expressions whose meanings aren''t strictly compositional.', 4),
  ('english.vocabulary.word-formation-morphology', 'english.vocabulary', 'english', 'Word Formation (Morphology)', 'Applying prefixes, suffixes, compounding, and parts-of-speech shifts (*create → creation → creative → creatively*).', 5),
  ('english.vocabulary.register-appropriateness', 'english.vocabulary', 'english', 'Register & Appropriateness', 'Choosing between formal, neutral, academic, and informal/colloquial expressions for a given context.', 6),
  ('english.vocabulary.lexical-ambiguity-polysemy', 'english.vocabulary', 'english', 'Lexical Ambiguity & Polysemy', 'Disambiguating homonyms or multiple senses of a word based on syntactic or discourse cues.', 7),
  ('english.grammar.verb-tense-aspect', 'english.grammar', 'english', 'Verb Tense & Aspect', 'Present, past, future, continuous/progressive, perfect, and perfect continuous forms.', 1),
  ('english.grammar.modality-conditionals', 'english.grammar', 'english', 'Modality & Conditionals', 'Modals of ability, obligation, permission, deduction, and zero/first/second/third/mixed conditionals.', 2),
  ('english.grammar.voice-causatives', 'english.grammar', 'english', 'Voice & Causatives', 'Active vs. passive voice and causative structures (*have/get something done*).', 3),
  ('english.grammar.clause-combining-complex-syntax', 'english.grammar', 'english', 'Clause Combining & Complex Syntax', 'Relative clauses, noun clauses, adverbial clauses, subordination, and coordination.', 4),
  ('english.grammar.agreement-determiners', 'english.grammar', 'english', 'Agreement & Determiners', 'Subject-verb agreement (including tricky collective/quantifier cases), articles (*a/an/the/zero*), quantifiers, and pronouns.', 5),
  ('english.grammar.prepositions-dependent-prepositions', 'english.grammar', 'english', 'Prepositions & Dependent Prepositions', 'Spatial/temporal prepositions and fixed verb/adjective + preposition patterns.', 6),
  ('english.grammar.sentence-transformation-error-correction', 'english.grammar', 'english', 'Sentence Transformation & Error Correction', 'Rewriting sentences to preserve meaning or spotting/fixing syntactic errors.', 7),
  ('english.grammar.word-order-inversion', 'english.grammar', 'english', 'Word Order & Inversion', 'Standard SVO order, question formation, tag questions, and emphatic inversion (*Never have I...*).', 8),
  ('english.writing.topic-sentences-thesis-framing', 'english.writing', 'english', 'Topic Sentences & Thesis Framing', 'Selecting or constructing clear central claims.', 1),
  ('english.writing.paragraph-unity-coherence', 'english.writing', 'english', 'Paragraph Unity & Coherence', 'Ordering sentences logically and removing irrelevant distractor sentences.', 2),
  ('english.writing.transitions-discourse-flow', 'english.writing', 'english', 'Transitions & Discourse Flow', 'Linking ideas smoothly across sentences and paragraphs.', 3),
  ('english.writing.audience-purpose-genre-conventions', 'english.writing', 'english', 'Audience, Purpose & Genre Conventions', 'Adapting tone and structure for emails, reports, narratives, arguments, or instructions.', 4),
  ('english.writing.mechanics-spelling-punctuation-capitalization', 'english.writing', 'english', 'Mechanics (Spelling, Punctuation & Capitalization)', 'Commas, apostrophes, semicolons, quotation marks, and spelling rules.', 5),
  ('english.writing.syntactic-variety-conciseness', 'english.writing', 'english', 'Syntactic Variety & Conciseness', 'Eliminating wordiness, redundancy, or run-on/fragment errors while improving style.', 6),
  ('english.speaking.segmental-pronunciation-vowels-consonants', 'english.speaking', 'english', 'Segmental Pronunciation (Vowels & Consonants)', 'Producing target phonemes accurately.', 1),
  ('english.speaking.word-stress-sentence-stress', 'english.speaking', 'english', 'Word Stress & Sentence Stress', 'Placing stress on the right syllable or content word to convey focus.', 2),
  ('english.speaking.intonation-fluency', 'english.speaking', 'english', 'Intonation & Fluency', 'Maintaining smooth pacing, self-correction, and natural phrasing without unnatural hesitation.', 3),
  ('english.speaking.functional-speaking', 'english.speaking', 'english', 'Functional Speaking', 'Describing images, giving opinions, comparing options, role-playing, or summarizing prompts.', 4)
on conflict (id) do nothing;

insert into public.subject_question_types (subject_id, question_type)
select 'english', id from public.question_types on conflict do nothing;

-- ------------------------------------------------------------- backfill
-- existing content is English; the four old skills become English domains
update public.content_sets set subject_id = 'english' where subject_id is null;
update public.content_sets set domain_id = case skill when 'vocabulary' then 'english.vocabulary' when 'grammar' then 'english.grammar'
                                                      when 'reading' then 'english.reading' when 'spelling' then 'english.writing' end
 where domain_id is null and subject_id = 'english';
update public.mq_questions set subject_id = 'english' where subject_id is null and (subject is null or lower(btrim(subject)) = 'english');
update public.mq_questions set domain_id = case type when 'reading' then 'english.reading' when 'listening' then 'english.listening'
                                                      when 'spelling' then 'english.writing' end
 where domain_id is null and subject_id = 'english';
-- teachers who already exist keep working: approve English for them
insert into public.teacher_subjects (teacher_id, subject_id, status, decided_at)
select id, 'english', 'approved', now() from public.profiles where role = 'teacher' and teacher_status = 'approved'
on conflict do nothing;

grant execute on function public.is_subject_teacher(text) to authenticated;
commit;
