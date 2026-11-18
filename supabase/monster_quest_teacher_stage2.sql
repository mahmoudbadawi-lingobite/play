-- =====================================================================
-- MONSTER QUEST  -  Teacher update, stage 2: student progress dashboard
-- Run once in the Supabase SQL editor (safe to re-run).
-- Needs: monster_quest_patch.sql + monster_quest_phase2_patch.sql.
-- (Stage 1 is NOT required for this one, but you will want both.)
--
-- Adds two read-only functions for teachers (and admins):
--   mq_class_progress(class_id, days)            one class: every student, topic accuracy,
--                                                hardest questions, last 14 days of activity
--   mq_student_progress(class_id, student_id, days)   one student: topics, recent answers,
--                                                monsters, last 14 days of activity
-- p_days = 7 / 30 limits the accuracy figures to that many days; NULL = all time.
-- Only the teacher who owns the class (or an admin) can read it; nobody else gets anything.
-- Nothing is created or changed in your tables.
-- =====================================================================
begin;

create or replace function public.mq_can_view_class(p_class uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_admin()
      or exists (select 1 from public.classes c where c.id = p_class and c.teacher_id = auth.uid());
$$;

-- ------------------------------------------------------------ one class
create or replace function public.mq_class_progress(p_class_id uuid, p_days int default null)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  since timestamptz := case when p_days is null then '-infinity'::timestamptz else now() - make_interval(days => p_days) end;
  cls jsonb; students jsonb; topics jsonb; hard jsonb; activity jsonb;
begin
  if not public.mq_can_view_class(p_class_id) then raise exception 'This is not your class'; end if;

  select jsonb_build_object('id', c.id, 'name', c.name) into cls from public.classes c where c.id = p_class_id;
  if cls is null then raise exception 'Class not found'; end if;

  -- every student of the class (also those who never opened the game)
  select coalesce(jsonb_agg(to_jsonb(x) order by lower(x.name)), '[]'::jsonb) into students from (
    select p.id,
           coalesce(nullif(p.display_name, ''), p.email, 'Student') as name,
           p.total_xp as xp,
           public.mq_level(p.total_xp) as level,
           (mp.user_id is not null) as started,
           coalesce(mp.coins, 0) as coins,
           coalesce(mon.n, 0) as monsters,
           coalesce(mon.sp, 0) as species,
           coalesce(a.n, 0) as answers,
           coalesce(a.ok, 0) as correct,
           coalesce(la.t, mp.last_encounter_at) as last_active
      from public.class_students cs
      join public.profiles p on p.id = cs.student_id
      left join public.mq_players mp on mp.user_id = p.id
      left join lateral (select count(*) as n, count(distinct species_id) as sp
                           from public.mq_player_monsters where user_id = p.id) mon on true
      left join lateral (select count(*) as n, count(*) filter (where correct) as ok
                           from public.mq_answers where user_id = p.id and answered_at >= since) a on true
      left join lateral (select max(answered_at) as t from public.mq_answers where user_id = p.id) la on true
     where cs.class_id = p_class_id
  ) x;

  -- accuracy per topic across the class, weakest first
  select coalesce(jsonb_agg(to_jsonb(t) order by t.accuracy, t.answers desc), '[]'::jsonb) into topics from (
    select coalesce(nullif(q.topic, ''), 'No topic') as topic,
           count(*) as answers,
           count(*) filter (where a.correct) as correct,
           round(100.0 * count(*) filter (where a.correct) / count(*))::int as accuracy
      from public.mq_answers a
      join public.class_students cs on cs.student_id = a.user_id and cs.class_id = p_class_id
      join public.mq_questions q on q.id = a.question_id
     where a.answered_at >= since
     group by 1
  ) t;

  -- the questions this class gets wrong most often (at least 3 answers)
  select coalesce(jsonb_agg(to_jsonb(h) order by h.accuracy, h.answers desc), '[]'::jsonb) into hard from (
    select q.id, q.prompt, q.type, q.topic,
           count(*) as answers,
           count(*) filter (where a.correct) as correct,
           round(100.0 * count(*) filter (where a.correct) / count(*))::int as accuracy
      from public.mq_answers a
      join public.class_students cs on cs.student_id = a.user_id and cs.class_id = p_class_id
      join public.mq_questions q on q.id = a.question_id
     where a.answered_at >= since
     group by q.id, q.prompt, q.type, q.topic
    having count(*) >= 3
     order by accuracy, answers desc, q.id   -- weakest first, then most answered
     limit 10
  ) h;

  -- answers per day, last 14 days (today last), whole class
  select coalesce(jsonb_agg(jsonb_build_object('day', d.day, 'answers', coalesce(n.c, 0), 'players', coalesce(n.pl, 0)) order by d.day), '[]'::jsonb) into activity
    from (select (current_date - g)::date as day from generate_series(0, 13) g) d
    left join (
      select a.answered_at::date as day, count(*) as c, count(distinct a.user_id) as pl
        from public.mq_answers a
        join public.class_students cs on cs.student_id = a.user_id and cs.class_id = p_class_id
       where a.answered_at >= current_date - 13
       group by 1
    ) n on n.day = d.day;

  return jsonb_build_object('class', cls, 'days', p_days, 'students', students, 'topics', topics, 'hard', hard, 'activity', activity);
end;
$$;

-- --------------------------------------------------------- one student
create or replace function public.mq_student_progress(p_class_id uuid, p_student_id uuid, p_days int default null)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  since timestamptz := case when p_days is null then '-infinity'::timestamptz else now() - make_interval(days => p_days) end;
  topics jsonb; recent jsonb; monsters jsonb; activity jsonb;
begin
  if not public.mq_can_view_class(p_class_id) then raise exception 'This is not your class'; end if;
  if not exists (select 1 from public.class_students where class_id = p_class_id and student_id = p_student_id) then
    raise exception 'This student is not in that class';
  end if;

  select coalesce(jsonb_agg(to_jsonb(t) order by t.accuracy, t.answers desc), '[]'::jsonb) into topics from (
    select coalesce(nullif(q.topic, ''), 'No topic') as topic,
           count(*) as answers,
           count(*) filter (where a.correct) as correct,
           round(100.0 * count(*) filter (where a.correct) / count(*))::int as accuracy
      from public.mq_answers a join public.mq_questions q on q.id = a.question_id
     where a.user_id = p_student_id and a.answered_at >= since
     group by 1
  ) t;

  -- the last 20 answers (ignores the day filter so a quiet week still shows something)
  select coalesce(jsonb_agg(to_jsonb(r) order by r.at desc), '[]'::jsonb) into recent from (
    select q.prompt, q.type, q.topic, a.correct, a.response_ms, a.answered_at as at
      from public.mq_answers a join public.mq_questions q on q.id = a.question_id
     where a.user_id = p_student_id
     order by a.answered_at desc
     limit 20
  ) r;

  select coalesce(jsonb_agg(to_jsonb(m) order by m.level desc, m.name), '[]'::jsonb) into monsters from (
    select s.name, pm.level, pm.team_slot is not null as in_team
      from public.mq_player_monsters pm join public.mq_species s on s.id = pm.species_id
     where pm.user_id = p_student_id
     order by pm.level desc, s.name
     limit 40
  ) m;

  select coalesce(jsonb_agg(jsonb_build_object('day', d.day, 'answers', coalesce(n.c, 0)) order by d.day), '[]'::jsonb) into activity
    from (select (current_date - g)::date as day from generate_series(0, 13) g) d
    left join (
      select answered_at::date as day, count(*) as c from public.mq_answers
       where user_id = p_student_id and answered_at >= current_date - 13 group by 1
    ) n on n.day = d.day;

  return jsonb_build_object('topics', topics, 'recent', recent, 'monsters', monsters, 'activity', activity);
end;
$$;

grant execute on function public.mq_can_view_class(uuid) to authenticated;
grant execute on function public.mq_class_progress(uuid, int) to authenticated;
grant execute on function public.mq_student_progress(uuid, uuid, int) to authenticated;
commit;
