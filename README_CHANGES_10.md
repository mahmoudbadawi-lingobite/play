# Update 10 (teacher stage 1): aim questions at classes

Copy these files over the project (same paths), then run ONE SQL file in the Supabase SQL editor:
`supabase/monster_quest_teacher_stage1.sql` (safe to re-run; needs the Monster Quest phase 1 + 2 patches you already ran).

## What changes for a teacher
* Every question can now be aimed at **Everyone** (as before) or at **one or more of your classes**. A question aimed at classes is only asked to
  students enrolled in those classes (and to you, the class teacher, when you play). "Everyone" questions still go to all students.
* Question Bank: an "Audience" column, an audience filter, a "Send new questions to" selector (used for new, imported and generated-from-set
  questions), an audience picker inside the question form, and checkboxes + "Set audience..." to change many questions at once.
* Nothing changes until you pick a class: all existing questions stay "Everyone".

## Under the hood
* `mq_questions.class_ids uuid[]` (empty = everyone) and `mq_eligible(question, user)`.
* The three places that pick a question now only pick eligible ones: `mq_next_question` (wild encounters and training) and the special attack in
  `mq_battle_act`. Only the question-selection lines changed; the rest of both functions is your existing code.
* A trigger and `mq_set_question_audience()` stop a teacher aiming questions at a class that is not theirs (admins can target any class;
  the SQL editor is trusted).
* Deploy order does not matter: until the SQL is run, the Question Bank shows a yellow notice and works exactly as before.

## Files
* `supabase/monster_quest_teacher_stage1.sql`
* `src/features/monsterQuest/types.ts`, `api.ts`, `screens/QuestionBank.tsx`

## Tested
`tsc` clean, `vite build` clean, oxlint: no new warnings. The SQL was run on a real PostgreSQL 16 with your schema + phase 1/2 + explorers + roster patches:
applies twice without error; a student in class 1 only ever got global + class-1 questions (never class 2), a student in no class only global ones,
for wild encounters and for arena special attacks; a teacher cannot target or change another teacher's class/questions; students cannot read the bank.
Not tested: the new screen in a browser, and Supabase-specific behaviour (I used stand-ins for `auth`).
