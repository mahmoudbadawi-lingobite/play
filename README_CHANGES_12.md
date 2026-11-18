# Update 12: one background everywhere, one menu in the world panel (includes teacher stage 2)

This zip is cumulative: it contains everything from update 11 (teacher progress dashboard) plus the fixes below, so you can apply it on its own.
If you already ran `supabase/monster_quest_teacher_stage2.sql`, do not run it again (it is only here for completeness); if not, run it once.

## 1. Same starry background in every tab, normal and full screen
In normal mode the page scrolls, so the painted background was stretched over the whole (long) page and long pages such as Questions showed
only its pale cyan top, which made white text hard to read. In normal mode the background is now pinned to the window, so it is the same
dark starry picture as in full screen on every tab. The solid blue box I had put around Questions and Progress is removed (no longer needed).
* `ui-skin.css`: one rule (`.mq-root:not(.is-fs):not(.mq-wpanel) { background-attachment: fixed }`). To undo it, delete that rule.

## 2. Duplicate menu icons inside the world (shop, bag, profile...)
The page that opens on top of the world (for example when you walk into the shop) carried a second copy of the menu next to the main icon column.
It is gone. The main icon column now drives that page: tapping Shop, Bag, Monsters... switches the page without leaving the world, the highlighted
icon follows the page you are on, and Explore (or "Back to game", or Esc) returns to the exact same spot. Outside the world it is the normal menu.
* `world/panelBridge.ts` (new), `world/WorldPanel.tsx` (menu removed), `MonsterQuestPage.tsx` (the main menu follows and drives the panel),
  `world/world-panels.css` (layout of the panel without its menu column).

## Files
supabase/monster_quest_teacher_stage2.sql (only if not run yet); src/features/monsterQuest/: types.ts, api.ts, ui.tsx, ui-skin.css,
MonsterQuestPage.tsx, screens/QuestionBank.tsx, screens/TeacherProgress.tsx, world/WorldPanel.tsx, world/panelBridge.ts, world/world-panels.css

## Tested
tsc clean, vite build clean, no new lint warnings; 12 automated tests pass, including the real menu driving the real panel (one menu only,
highlight follows, the world is not reloaded when switching pages, Explore returns, normal navigation outside the world).
NOT tested: how the background looks in a real browser. Please check Questions, Progress and Profile in normal mode and in full screen.
