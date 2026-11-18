# Update 11 (teacher stage 2): student progress dashboard

Copy these files over the project (same paths), then run ONE SQL file in the Supabase SQL editor:
`supabase/monster_quest_teacher_stage2.sql` (safe to re-run; read-only, creates no tables and changes no data).

## What a teacher sees: new "Progress" tab (teachers and admins only)
Side menu: Progress (next to Questions), also in the in-game full-screen menu. Pick one of your classes and a period (7 days / 30 days / all time):
* Tiles: students, active this week, class accuracy, answers.
* Students table: level, monsters (and kinds), answers, accuracy bar, last active, and a status:
  "Has not started", "No answers yet", "Inactive 7+ days", "Low accuracy" (under 50% after 10+ answers) or "On track".
  Sort: needs attention first (default), name, accuracy, most / least recently active.
* Tap a student: accuracy by topic (weakest first), answers per day (14 days), monsters, latest 20 answers.
* Topics to revisit (class accuracy by topic), Hardest questions (3+ answers, lowest accuracy first), class activity for 14 days.
* Download CSV of the students table (opens correctly in Excel, Arabic names included).
Level, XP and monsters are totals; answers and accuracy follow the period. Students who never opened the game are listed with zeros.

## Under the hood
* `mq_class_progress(class, days)` and `mq_student_progress(class, student, days)`: only the teacher who owns the class (or an admin) can
  read them; anyone else gets "This is not your class". They read mq_answers, mq_players, mq_player_monsters, profiles, class_students.
* New file `screens/TeacherProgress.tsx`; `ui.tsx` gets `NavIcon` (draws an emoji where no painted icon exists, used by the new tab);
  `MonsterQuestPage.tsx` and `world/WorldPanel.tsx` get the menu entry and route; `types.ts` / `api.ts` get the new types and calls
  (they also still contain the stage 1 changes).
* Until the SQL is run, the tab shows a yellow message saying so instead of failing.

## Files
supabase/monster_quest_teacher_stage2.sql; src/features/monsterQuest/: types.ts, api.ts, ui.tsx, MonsterQuestPage.tsx, screens/TeacherProgress.tsx, world/WorldPanel.tsx

## Tested
tsc clean, vite build clean, no new lint warnings. SQL run on PostgreSQL 16 with your schema + patches (applied twice; correct totals, 7-day
filter, other classes' answers never leak in, never-played students listed, other teachers / students / wrong class refused).
The screen was rendered in a simulated browser (jsdom) with the real database output: totals, attention sorting, period switch,
student detail, CSV (BOM, formula-safe), and the "run the SQL" message. Not tested: in a real browser (layout, phone), or on real Supabase.
