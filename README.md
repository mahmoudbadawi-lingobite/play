# LingoBite Play

Educational games for the LingoBite ecosystem — teachers turn word lists into
six different games, students play them for XP.

Part of the same product family as **LingoBite** (lessons) and **LingoTrace**
(class/session management) — same visual identity, but its **own Firebase
project**, own accounts, and own data. Nothing is shared automatically
between the three apps; a teacher's Google login works the same way in all of
them, but content and rosters are separate.

## Stack

React + TypeScript + Vite, Tailwind CSS, Firebase (Auth + Firestore),
react-i18next (English / Arabic UI, Arabic is interface-only — games and
content stay English), SheetJS (xlsx) for the content template pipeline,
React Router.

## Getting started

```bash
npm install
cp .env.example .env   # fill in your Firebase project's config
npm run dev
```

## Firebase setup

1. Create a **new, separate** Firebase project (do not reuse LingoBite's or
   LingoTrace's).
2. Enable **Authentication → Google** sign-in.
3. Enable **Firestore** (production mode) and deploy the included rules:
   ```bash
   firebase deploy --only firestore:rules
   ```
   `firestore.rules` covers: users can't self-promote to teacher/admin (only
   an Admin can), content sets are readable when public or owned, only
   playCount/reportCount can be bumped by any signed-in user, classes can be
   read by any signed-in user (needed to look up a join code) but only a
   student adding themselves to `studentIds` is allowed as a non-owner
   update, and game results are create-only (no editing past scores).
4. Copy your web app config into `.env` (see `.env.example`).

## First admin

There's no UI to promote the first Admin — after signing in once, manually
set `role: "admin"` on your user document in the Firestore console.

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
`/teacher/classes`). Students go to `/join`, enter it, and are added to the
class's roster and their own `classIds`. There's no cap on how many classes
a student can join.

## Moderation

Any signed-in user can report a public game from the library
(`⚑ Report this content`). Reports increment a counter and log a reason in
`contentReports`; Admin sees a "Reported content" list on `/admin` with
options to unpublish (sets it private) or dismiss.

## Parental consent

The first time a **student** account reaches a protected page, they see a
one-time interstitial confirming a parent/guardian or teacher knows they're
using the app, with an optional parent email field. Teachers and Admins
(adult accounts) skip this. This is a lightweight acknowledgment flow, not a
verified-consent system — for stricter compliance (e.g. formal COPPA
verifiable parental consent), that would need a real verification step
(e.g. a parent-side confirmation email/link) added later.

## Deploying (GitHub Pages)

A workflow is included at `.github/workflows/deploy.yml`. Push to `main`,
set the repo's Pages source to "GitHub Actions", and add your Firebase
config as repo secrets (`VITE_FIREBASE_API_KEY`, etc.) referenced in the
workflow.

## Known v1 simplifications (flagged for later)

- Crossword layout uses a simple intersection algorithm — good for 5-12
  items, not a full crossword-construction solver.
- Parental consent is an acknowledgment checkbox, not verified consent (see
  above).
- No email notification to teachers when their content is unpublished by an
  Admin — they'd need to check back on `/teacher/create` or be told
  directly for now.
