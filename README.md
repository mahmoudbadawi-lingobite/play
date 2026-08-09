# LingoBite Play

Educational games for the LingoBite ecosystem — teachers turn word lists into
six different games, students play them for XP.

Part of the same product family as **LingoBite** (lessons) and **LingoTrace**
(class/session management) — same visual identity, but its **own backend**,
own accounts, and own data. Nothing is shared automatically between the
three apps.

## Stack

React + TypeScript + Vite, Tailwind CSS, **Supabase** (Postgres + Auth +
Row Level Security), react-i18next (English / Arabic UI, Arabic is
interface-only — games and content stay English), SheetJS (xlsx) for the
content template pipeline, React Router.

> This app originally targeted Firebase, matching LingoBite/LingoTrace. It
> was switched to Supabase because Firestore now requires a linked billing
> account (Blaze plan) to provision a database at all, and billing accounts
> with a Saudi Arabia address must go through a reseller (CNTXT) via a
> business contact form rather than instant self-serve card entry — not a
> fit for an individual/pilot project. Supabase's free tier requires no
> card and no regional reseller. The UI, games, and content pipeline are
> unchanged; only the backend layer differs from the other two apps.

## Getting started

```bash
npm install
cp .env.example .env   # fill in your Supabase project's URL + anon key
npm run dev
```

## Supabase setup

1. Create a **new, separate** Supabase project at [supabase.com](https://supabase.com)
   (free tier, no card required). Pick a region close to your users.
2. **Run the schema**: Supabase Dashboard → **SQL Editor** → paste the
   entire contents of `supabase/schema.sql` → **Run**. This creates every
   table, Row Level Security policy, and helper function the app needs —
   it's the Supabase equivalent of `firestore.rules`, but expressed as
   actual Postgres policies plus a few `security definer` functions for
   actions that need to safely bypass a strict owner-only policy (bumping
   a play counter, joining a class by code, awarding XP, admin actions).
3. **Enable Google sign-in**: Dashboard → **Authentication → Providers →
   Google** → toggle on. Create an OAuth Client ID (type: Web application)
   in [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials)
   (any Google Cloud project works — this doesn't need Firestore/Blaze),
   paste Supabase's provided callback URL into "Authorized redirect URIs,"
   then paste the resulting Client ID + Secret back into Supabase.
4. **Get your API keys**: Dashboard → **Settings → API** → copy the
   **Project URL** and **anon public** key into `.env` (see
   `.env.example`). The anon key is safe to expose client-side by design —
   real access control comes from the RLS policies in `schema.sql`, not
   from hiding this key.

## Cloudinary setup (for the announcement bar)

1. Create a free account at [cloudinary.com](https://cloudinary.com) (no
   card required for the free tier).
2. Your **Cloud name** is shown on the Dashboard homepage.
3. Create an **unsigned upload preset**: Settings (gear icon) → **Upload**
   → **Upload presets** → **Add upload preset** → set **Signing Mode** to
   **Unsigned** → Save. Note the preset name.
4. Add both to `.env` (see `.env.example`):
   ```
   VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name
   VITE_CLOUDINARY_UPLOAD_PRESET=your-preset-name
   ```
5. Add the same two as GitHub repo secrets if deploying (Settings →
   Secrets and variables → Actions) — `deploy.yml` already references them.

An unsigned preset means uploads happen directly from the browser with no
backend signing step - matching the pattern already used elsewhere in the
LingoBite ecosystem.

## Announcement bar

A thin text-or-photo strip shown above the header on every page, to every
visitor including signed-out guests - managed entirely from `/admin`.
Only one announcement is active at a time; publishing a new one
automatically retires the previous one. It's dismissible per-visit (a
session-only close button, not persisted) and responsive - text and image
both cap their height on small screens.

## Homepage banner

A larger centered photo or auto-playing video shown right below the
header (a separate area, not part of the sticky header itself - it
scrolls away normally with the page), inside a rounded, shadowed frame.
Video autoplays muted and loops (muted is required for autoplay to work
in browsers), with controls visible so a visitor can pause or unmute.
Managed from `/admin`, same one-active-at-a-time pattern as the
announcement bar. Fully responsive: the frame keeps a 16:9 shape and
shrinks with the screen, with visible background margin on every side
rather than running edge-to-edge, even on small phones.

## First admin

There's no UI to promote the first Admin — after signing in once, open
**Table Editor → profiles** in the Supabase dashboard, find your row, and
change `role` from `student` to `admin`.

## Content model

Every game reads the same shape:

```ts
{ term: string, clue: string, imageUrl?: string }
```

Teachers download an Excel template per skill (Vocabulary / Grammar /
Reading / Spelling), fill it in offline, and upload it back — the app parses
it into that shape. Any set with enough items (and images, for Picture
Match) unlocks the games that can use it; nothing about the content changes
per game.

## Admin notifications

Two live, Realtime-driven notifications, both visible only to admins:

- **Direct message badge + chime** — a red badge on the "Admin Chat" nav
  link shows total unread DMs across every conversation, and each admin in
  the DM sidebar shows their own per-conversation unread count. A short
  two-note chime (generated in-browser via the Web Audio API - no audio
  file needed) plays when a new DM arrives **and that specific conversation
  isn't currently open**; if it is open, the message is marked read
  immediately instead, silently.
- **Teacher-request bell** — a red badge on the "🔔 Admin" nav link shows
  the count of pending teacher-access requests, updating live the moment
  someone requests access or an existing request is approved/rejected.

## Admin chat

Admins-only messaging at `/admin/chat` - a shared group thread every admin
sees, plus 1:1 direct messages between specific admins. Not visible to or
usable by teachers or students in any way. Uses Supabase Realtime
(`postgres_changes`), so messages appear instantly without polling; the
schema includes the `alter publication supabase_realtime add table ...`
statements this requires.

## Manage admins

`/admin` includes an admin-management panel: search any account by email
and promote it to Admin, or remove Admin access from anyone but yourself
(so you can't accidentally lock yourself out).

## Escape Room

A separate game type from the main six (its own "Escape Rooms" nav tab,
not mixed into the Game Library), since it needs a different content
shape: a background image with an ordered set of clickable hotspots
instead of the universal `{term, clue, imageUrl}` item. Teachers upload an
image, then click directly on it to drop numbered clue markers - each with
a typed or multiple-choice answer. Students see one clue at a time, click
where they think the object is (a "hot/warm/cold" hint appears on a miss),
then answer it correctly to unlock the next clue in sequence. Wrong clicks
and wrong answers both count against the final score. Has its own
moderation (report/unpublish/reactivate/delete) in `/admin`, matching the
main content sets.

**Story introduction**: an optional field on each room. If set, students
see a briefing screen with the story and a "Begin" button before the
room's timer starts - so reading time never counts against their score.

**AI Prompt Generator**: a step inside "Create Escape Room," before the
image upload. The teacher picks a theme, grade (1-12), difficulty, and
question type via buttons, plus optional vocabulary/grammar/reading/spelling
lists, and the tool assembles three ready-to-copy prompts (background
image, story, clue questions) for pasting into any external AI tool. It
does not call any AI itself - the teacher runs the prompts elsewhere, then
comes back to upload the resulting image, paste the story, and enter the
clues using the tools already in the app.

## Games included (v1)

Memory Match, Typing Race, Word Builder, Crossword, Picture Match, Hangman —
see `src/games/registry.ts` for the compatibility rules, and
`src/components/games/` for each engine. Adding a 7th game later means
writing one component with the `{ items, onFinish }` contract and registering
it — no changes to content authoring needed.

## Classes and joining

A teacher's class gets a random 6-character join code (shown on
`/teacher/classes`). Students go to `/join`, enter it, and the
`join_class_by_code` Postgres function validates the code and adds them to
`class_students` server-side.

## Moderation

Any signed-in user can report a public game from the library
(`⚑ Report this content`). Reports increment a counter and log a reason in
`content_reports`; Admin sees a "Reported content" list on `/admin` with
options to unpublish (sets it private) or dismiss.

## Parental consent

The first time a **student** account reaches a protected page, they see a
one-time interstitial confirming a parent/guardian or teacher knows they're
using the app, with an optional parent email field. Teachers and Admins
(adult accounts) skip this. This is a lightweight acknowledgment flow, not a
verified-consent system — for stricter compliance (e.g. formal COPPA
verifiable parental consent), that would need a real verification step
added later.

## Deploying (GitHub Pages)

A workflow is included at `.github/workflows/deploy.yml`. Push to `main`,
set the repo's Pages source to "GitHub Actions", and add
`VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` as repo secrets (Settings →
Secrets and variables → Actions).

## Known v1 simplifications (flagged for later)

- Crossword layout uses a simple intersection algorithm — good for 5-12
  items, not a full crossword-construction solver.
- Parental consent is an acknowledgment checkbox, not verified consent (see
  above).
- No email notification to teachers when their content is unpublished by an
  Admin.
- Supabase's free tier pauses a project after a week of no activity (it
  wakes back up automatically on the next request, with a short cold-start
  delay) — worth knowing if you leave the app untouched for a while during
  a school break.
