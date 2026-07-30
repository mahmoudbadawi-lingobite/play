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
