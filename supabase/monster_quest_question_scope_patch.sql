-- =====================================================================
-- MONSTER QUEST - a teacher's "Everyone" questions stay with that teacher's students.
-- Run once in the Supabase SQL editor (safe to re-run). Needs monster_quest_teacher_stage1.sql.
--
-- Who receives a question (mq_eligible):
--  * aimed at one or more classes        -> students of those classes (and the class's teacher), as before
--  * "Everyone" and made by a TEACHER    -> students in any class of that teacher, and that teacher
--                                           (students who are in no class at all still get them, so they are not left empty)
--  * "Everyone" and made by an ADMIN, or built-in starter questions (no owner) -> every student
-- =====================================================================
create or replace function public.mq_eligible(q public.mq_questions, p_user uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select case
    when cardinality(q.class_ids) > 0 then
         exists (select 1 from public.class_students cs where cs.student_id = p_user and cs.class_id = any(q.class_ids))
      or exists (select 1 from public.classes c where c.teacher_id = p_user and c.id = any(q.class_ids))
    when q.created_by is null then true
    when q.created_by = p_user then true
    when exists (select 1 from public.profiles pr where pr.id = q.created_by and pr.role = 'admin') then true
    else exists (select 1 from public.class_students cs join public.classes c on c.id = cs.class_id
                 where cs.student_id = p_user and c.teacher_id = q.created_by)
      or (not exists (select 1 from public.class_students cs where cs.student_id = p_user)
          and not exists (select 1 from public.classes c where c.teacher_id = p_user))
  end;
$$;
