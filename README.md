# Picker — Full App (Next.js + Auth.js + Prisma)

This is Picker as one deployable Next.js app: the complete UI you've been
using (Home, Random Picker, Spin Wheel, Team Generator, Bracket, Number
Generator, Coin Flip, Dice Roller, extra tools, Saved Lists, History,
Settings, About) plus a real backend — Google/GitHub/email sign-in via
[Auth.js](https://authjs.dev) and Postgres via [Prisma](https://www.prisma.io)
— so lists and history sync across devices when someone signs in.

## How it's put together

The picker UI is intentionally **not** rewritten into idiomatic React
components. It's a large, already-working, thoroughly-tested client-side app
(canvas wheel physics, weighted picks, bracket elimination logic, undo
snackbars, sound styles, QR sharing, spreadsheet paste…) — rewriting all of
that into React state/props would be a big, risky undertaking with real
chances of introducing subtle bugs, for no real UI difference.

Instead:

- `src/app/appShell.ts` — the static page markup (sidebar, overlays, toast),
  extracted verbatim from the original app.
- `src/app/appScript.ts` — the original app's entire client-side logic
  (routing, state, every tool), extracted verbatim, with one small patch: the
  Settings page's "Continue with Google/GitHub/email" buttons now call real
  Auth.js sign-in instead of being inert placeholders.
- `src/app/appBridge.ts` — a small script that runs immediately after the app
  script (in the same global scope, since classic `<script>` tags in the
  same document share one top-level scope). It exposes `window.__pickerAuth`
  and wraps the app's existing `persistAll()` function so every local save
  also pushes to `/api/sync`, debounced by 1.5s.
- `src/app/PickerApp.tsx` — the Next.js Client Component that renders the
  shell, loads the CDN libraries (confetti, html2canvas, jsPDF), injects the
  two scripts once both are ready, and keeps `window.__pickerAuth` in sync
  with the real `useSession()` state from `next-auth/react`.

Net effect: same app, pixel-for-pixel, now running inside a real Next.js
project with working accounts and cross-device sync layered on top.

## 1. Prerequisites

- Node.js 18.18+
- A Postgres database — [Neon](https://neon.tech), [Supabase](https://supabase.com),
  or [Vercel Postgres](https://vercel.com/storage/postgres) all have usable
  free tiers.

## 2. Local setup

```bash
npm install
cp .env.example .env
```

Fill in `.env`:

- `DATABASE_URL` — your Postgres connection string.
- `AUTH_SECRET` — generate with `openssl rand -base64 32`.
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — from the
  [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
  Redirect URI: `http://localhost:3000/api/auth/callback/google`.
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` — from
  [GitHub OAuth Apps](https://github.com/settings/developers).
  Callback URL: `http://localhost:3000/api/auth/callback/github`.
- `EMAIL_SERVER` / `EMAIL_FROM` — any SMTP creds (Resend, Postmark, SendGrid,
  Mailgun, or your own mail server all work).

You only need one provider configured to get started — the sign-in buttons
for providers without credentials are simply skipped server-side.

Push the schema, then run it:

```bash
npm run db:push
npm run dev
```

Visit `http://localhost:3000` — it's the full Picker app. Sign in from
Settings → Account & sync, create/edit a list, and it'll show up in your
database (`npm run db:studio`) within ~1.5 seconds.

## 3. How sync works

- **Signed out**: everything behaves exactly like before — `localStorage`
  only, zero network calls, nothing changes.
- **Sign in**: the app immediately `GET /api/sync`s your saved lists and
  history from the server and merges them into local state (server data
  wins on id conflicts; anything local-only is kept).
- **While signed in**: every local save (`persistAll()`, which the whole app
  already calls after every edit) queues a debounced `POST /api/sync` that
  replaces your server-side lists wholesale and upserts new history entries.
  This is a "last write wins, full replace" sync — simple and correct for a
  single person's own data; it is *not* built for concurrent multi-device
  editing at the same instant.
- A **"Sync now"** button in Settings triggers an immediate pull + push if
  you don't want to wait for the debounce.

## 4. API reference

All routes require a signed-in session and are scoped to that user.

| Method | Path                | Body                              | Notes                                  |
|--------|---------------------|-------------------------------------|-----------------------------------------|
| GET    | `/api/sync`          | —                                  | Pull all lists + history (used on sign-in) |
| POST   | `/api/sync`          | `{ lists: [...], history: [...] }` | Full sync push (used by the bridge script) |
| GET    | `/api/lists`         | —                                  | All saved lists                          |
| POST   | `/api/lists`         | `{ name, items }`                  | Create a list directly                   |
| PUT    | `/api/lists/:id`     | `{ name?, items? }`                | Update a list directly                   |
| DELETE | `/api/lists/:id`     | —                                  | Delete a list directly                   |
| GET    | `/api/history`       | —                                  | Last 200 history entries                 |
| POST   | `/api/history`       | `{ type, result, meta? }`          | Add a history entry directly             |
| DELETE | `/api/history`       | —                                  | Clear all history                        |
| DELETE | `/api/history/:id`   | —                                  | Delete one history entry                 |

The `/api/lists` and `/api/history` CRUD routes are kept from the original
backend scaffold and still work standalone — `/api/sync` is what the app's
bridge script actually uses day to day.

## 5. Deploying

1. Push this project to a GitHub repo.
2. Import it in [Vercel](https://vercel.com/new).
3. Add the same environment variables from `.env`, with `NEXTAUTH_URL` set
   to your production URL.
4. Add your production callback URLs to the Google/GitHub OAuth app configs.
5. Run `npx prisma db push` once against your production `DATABASE_URL`.

## Notes / things to harden before going public

- Rate limiting, input validation, and a test suite are now included — see
  **Hardening** below.
- The QR-code share feature calls a public third-party API
  (`api.qrserver.com`) directly from the browser — fine for personal use,
  but swap in a self-hosted QR library if that's a concern for you.
- Sync is "full replace" on lists, which is simple and predictable but not
  a CRDT — two devices editing offline at the exact same time can clobber
  each other. Fine for how this app is actually used; worth knowing.

## 6. Hardening

**Rate limiting** (`src/lib/rateLimit.ts`) — every route checks a limit
before touching the database: 60 requests/minute for reads and `/api/sync`
(which fires on every save, debounced client-side), 20/minute for direct
writes (`POST`/`PUT`/`DELETE` on `/api/lists` and `/api/history`). Limited by
user id when signed in.

Without `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` set, it falls
back to an in-memory limiter — correct for local dev, but **not** safe across
multiple serverless instances in production (each instance has its own
memory). Add a free [Upstash](https://upstash.com) Redis database and set
those two env vars before deploying somewhere with more than one instance;
the code switches over automatically, no other changes needed.

**Validation** (`src/lib/validation.ts`) — every write body is checked
against a [Zod](https://zod.dev) schema before it reaches Prisma: required
fields, string length caps, a positive-number check on item weight, a
hex-color format check, and array-size caps (5000 items/list, 500
lists/sync call, 1000 history entries/sync call) so a malformed or hostile
payload can't blow up the database or the request. Invalid requests get a
`400` with a `details` object naming exactly which field failed.

**Tests** (`tests/`) — run with:

```bash
npm test          # single run
npm run test:watch
```

Covers:
- `tests/validation.test.ts` — every Zod schema, valid and invalid cases
- `tests/rateLimit.test.ts` — the in-memory limiter actually limits, and
  tracks identifiers independently
- `tests/api/lists.test.ts`, `tests/api/history.test.ts`,
  `tests/api/sync.test.ts` — route handlers with `@/lib/auth` and
  `@/lib/prisma` mocked, checking: 401 when signed out, 400 (and no database
  call at all) for invalid bodies, and correct Prisma calls for valid ones

These tests don't need a real database or a running server — they import
the route handler functions directly and call them with real `Request`
objects, which is how Next.js Route Handlers are designed to be tested.

## 7. SEO

Every tool now has its own real, crawlable URL instead of only existing as a
`#hash` on `/` — `/picker`, `/wheel`, `/teams`, `/bracket`, `/numbers`,
`/coin`, `/dice`, `/extras`, and `/about` are all genuine Next.js routes with
their own server-rendered metadata. Account-specific pages (`/lists`,
`/history`, `/settings`) exist too, but are marked `noindex` since there's
nothing there for a search engine to usefully index.

This works without duplicating the app: `appScript.ts`'s router now falls
back to `location.pathname` when there's no `#hash` present, so visiting
`/wheel` directly opens straight to the Spin Wheel — in-app navigation via
the sidebar (`<a href="#wheel">`) still works exactly as before, purely via
hash changes, without a full page reload.

What's included per route:

- **Unique `<title>` and meta description** (`src/lib/pageMeta.ts` — a small
  shared helper so every route's metadata is built consistently)
- **Open Graph + Twitter card image**, generated on the fly with `next/og`
  (`src/lib/ogImage.tsx` + each route's `opengraph-image.tsx`) — no static
  image asset to keep in sync, it's rendered from the same title/description
  as the page
- **Canonical URL** on every page
- **`sitemap.xml`** (`src/app/sitemap.ts`) listing every indexable route
- **`robots.txt`** (`src/app/robots.ts`), disallowing `/api/` and `/signin`
  and pointing at the sitemap
- **JSON-LD structured data** — a `WebApplication` schema in the root layout
  (name, description, free-offer price, category) so Google can render a
  richer result

Set `NEXT_PUBLIC_SITE_URL` in `.env` to your real domain before deploying —
it's used to build the sitemap, canonical URLs, and Open Graph URLs. Without
it, everything falls back to a placeholder `https://example.com`.

