# Subjects, skills and teacher-subject links (whole web app)

## Order
1. Upload the files in this zip (same folder structure as the repo). The site keeps working before step 2; the new screens just say "run the SQL".
2. Supabase → SQL editor → run `supabase/subjects_skills_patch.sql` (safe to re-run). It seeds **English** with the 6 domains / 42 skills from your taxonomy file, links the 9 question types to English, tags every existing question and game as English, and approves English for teachers that are already approved.
3. Sign in as admin → **Subjects** (menu). Add a subject, paste its taxonomy (same format as the English file: `## 1. Name Sub-Skills` then `* **Skill:** description`), tick which question types it allows, set it active.
4. Teachers → **My Subjects**: pick subjects → admin approves under Subjects → Teacher requests.

## What changes for teachers
- Question Bank: Subject → Domain → Skill pickers (only their approved subjects), the Type list shows only the types that subject allows, optional thinking level, subject filter, skill shown in the table. Bulk import: `subject` column must be one of their subjects, optional `skill_id` column.
- Create / Edit game: same picker. The old 4-value skill (vocabulary, grammar, reading, spelling) stays; it drives templates and AI prompts.
- The database enforces it too, not only the screen.

## Not included yet
New question kinds for other subjects (e.g. numeric answer for Math) need a separate patch.

## Several skills per game / question (second patch)
Run `supabase/subjects_multi_skills_patch.sql` AFTER the first one (safe to re-run). Until then only the first chosen skill is saved.
