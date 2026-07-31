-- Run this once if your database was created before this policy was added.
-- Lets a teacher see the profiles (display_name etc.) of students enrolled
-- in their own classes - needed for the class roster feature.

create policy "profiles: teacher reads own students"
  on public.profiles for select
  using (
    exists (
      select 1 from public.class_students cs
      join public.classes c on c.id = cs.class_id
      where cs.student_id = profiles.id and c.teacher_id = auth.uid()
    )
  );
