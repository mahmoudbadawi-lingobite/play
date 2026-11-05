# Update 3: mixed-up monsters, phone layout, blank ground

Copy these files over the project (same paths). No SQL this time.

* `src/features/monsterQuest/api.ts`, `context.tsx` – **Monsters tab shows only YOUR monsters.** Your account is a teacher account and
  the database lets teachers/admins read every student's monsters, and the app did not filter the list, so students' monsters
  appeared mixed in with yours. Trying to put one of those in your team caused "those monsters are not yours".
  Students never saw this (they can only read their own). Now the list is filtered to your own account.
* `src/features/monsterQuest/world/world-panels.css` – phone layout: the world had a 420px minimum height, taller than a phone held
  sideways (about 360px), so the joystick and buttons were cut off. It now fits the real screen in full screen and normal view,
  respects notches, and uses slightly smaller controls on short screens.
* `src/features/monsterQuest/world/engine.ts` – phones sometimes throw away large canvases when memory is short, which leaves the ground
  and objects blank while the character still draws. The game now notices this and repaints the place automatically. I could not
  reproduce your exact phone, so if the ground is still missing after this update, tell me the phone model and whether it happens
  every time or only after switching apps.
