# Auth — the remaining stage

The app now reads and writes real data through the API, but **identity is still
client-supplied**. This document is the plan to close that gap. It is the one
piece that couldn't be built in the current environment, because it needs npm
packages that wouldn't install here, plus a security review.

## What exists today

- **Browse / detail** (`/api/boats`) — public, correct, done.
- **Owner writes** (`/api/vessels`, `/api/sits`) — open; the `owner` comes from
  the request body. Anyone can create or edit any listing.
- **Applications & messages** (`/api/applications`) — open; `applicant.name` and
  `senderName` come from the body. Anyone can post as anyone.
- **Destructive dev reset** (`/api/dev/reset`) — gated by `ADMIN_TOKEN`.
- The frontend's user comes from `store.ts` + `mockAuth.ts` (localStorage).

This is fine for a demo. It is **not** safe for real users: there is no proof
that the caller is who they claim to be.

## The gap, concretely

Every endpoint that mutates data trusts a name in the payload. Two problems:

1. **Impersonation** — I can accept my own application as "Maya & Finn", or edit
   someone else's vessel, just by sending their name.
2. **No ownership check** — even with a logged-in user, nothing verifies that
   _this_ user owns _that_ vessel before letting them change it.

## Plan: Better Auth on D1

Better Auth has first-class D1 support and runs on Workers. Steps:

1. **Install** (the part this environment couldn't do):
   `npm i better-auth better-auth-cloudflare`
2. **Session tables** — add `user`, `session`, `account`, `verification` to the
   Drizzle schema (Better Auth provides the shapes). New migration.
3. **Mount** the auth handler at `/api/auth/*`. Re-instantiate per request (never
   a module singleton — same Workers rule as the Drizzle client).
4. **Identity middleware** — replace `requireAdmin` on write routes with a
   `requireUser` that reads the session and puts the user on the context.
5. **Ownership checks** — in `vessels`/`sits` PUT/DELETE, load the row and verify
   `row.owner === session.user.id` (migrate `owner` from a display name to a
   stable user id; keep display name/image as profile fields).
6. **Applications** — derive `applicant`/`senderName` from the session, not the
   body. An owner can only change status on applications for _their_ listings; a
   sitter can only message threads they belong to.
7. **Frontend** — replace `mockAuth.ts` with Better Auth's client; `store.ts`
   holds the real session user. Because everything goes through `mockApi.ts`,
   only that file and the auth store change — `App.tsx` is untouched.

## Once identity is a stable user id

`updateOwnerOnVessels` (the rename-propagation hack in `mockApi.ts`) can be
deleted — owner name/image become profile lookups rather than duplicated columns.

## Do not ship writes publicly before this

Until step 5 lands, set `ENVIRONMENT=production` (so `/api/dev` is closed) **and**
keep the deployment access-limited, or put the write routes behind
`requireAdmin` too. Open write endpoints + a public URL = anyone can rewrite your
database.
