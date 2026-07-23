# Boat Sitter API

Hono on Cloudflare Workers, backed by D1 via Drizzle. The React app reaches the
API through `src/react-app/mockApi.ts` (filename kept for import stability).

That module always talks to the Worker via `apiClient.ts` / `apiRemote.ts`.
Writes require a Better Auth session. Local and Playwright flows can create one
with `POST /api/dev/login` (non-production). Remaining local-only gaps: identity
verification mock state and Apple/Facebook stubs in `mockAuth`.

## Data model

A listing the sitter browses is **`Boat = vessel ⋈ sit`**:

- **vessel** — the boat itself (name, systems, amenities, owner, engine/voltage/stove)
- **sit** — a period it needs watching (dates, location, duties, requirements)

One vessel can have many sits. Vessel ids end in `-boat` so the sit id stays the
clean slug used in URLs (`/boats/solstice`). Plus **applications** (with a nested
applicant snapshot and a **messages** thread) and **support_requests**.

Array fields (gallery, systems, amenities, responsibilities, …) are JSON text
columns — always read whole, never joined against.

## Setup

```bash
npm install
cp .dev.vars.example .dev.vars

npm run db:migrate:local
npm run db:seed:local
npm run dev
```

Open **http://localhost:5173/api/dev** for the console. The D1 database
(`boat-sitter-db`) id is already in `wrangler.json`.

Deploy:

```bash
npm run db:migrate:remote     # applies 0000 + 0001 (drops old boats table, builds new model)
npm run db:seed:remote        # dev data only
npm run build && npm run deploy
```

## Endpoints

### Public — browse / detail

| Method | Path             | Notes                                                                                                                                                                                                                                                                                       |
| ------ | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/api/boats`     | Filters applied in D1 SQL: `q`, `type` (slug e.g. `motor-yacht`; legacy labels still accepted), `sitType`, `from`, `to`, `pet`, `availability` (`open`/`accepted`), `sort`, `page`, `limit`. Response: `data`, `total`, `page`, `limit`, `totalPages`. Omit `limit` for the full match set. |
| GET    | `/api/boats/:id` | One listing by sit id; 404 if missing/unpublished                                                                                                                                                                                                                                           |

### Owner — vessels & sits _(writes require Better Auth session)_

| Method | Path                       | Notes                                                        |
| ------ | -------------------------- | ------------------------------------------------------------ |
| GET    | `/api/vessels` · `?owner=` | List (optionally by owner); `privateAccess` only for owner   |
| GET    | `/api/vessels/:id`         | One vessel; `privateAccess` only for owner                   |
| PUT    | `/api/vessels/:id`         | Upsert (create or update); stores `privateAccess`            |
| DELETE | `/api/vessels/:id`         | 409 `VESSEL_HAS_SITS` if sits reference it                   |
| GET    | `/api/sits`                | List (sits expose `boatId` = vessel id)                      |
| GET    | `/api/sits/:id/access`     | Private Wi-Fi/codes + full address; owner or accepted sitter |
| PUT    | `/api/sits/:id`            | Upsert; 400 if `boatId` vessel doesn't exist                 |
| DELETE | `/api/sits/:id`            |                                                              |

### Applications _(writes require Better Auth session)_

| Method | Path                                                  | Notes                                                                                                                                                                                                                                                                          |
| ------ | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| GET    | `/api/applications?sitId=`                            | Applications for one listing; `sort` (`newest`/`experience`/`skillMatch`/`priorSits`), `status`, `experience` (`any`/`meetsMin`/`fivePlus`/`tenPlus`), `page`, `limit` (default 20, max 50). Response: `data`, `accepted`, `total`, `page`, `limit`, `totalPages`, `sitTotal`. |
| GET    | `/api/applications?user=`                             | Where user is owner **or** applicant                                                                                                                                                                                                                                           |
| POST   | `/api/applications`                                   | `{ sitId, message, partySize?, applicant }`; identity from session                                                                                                                                                                                                             |
| PATCH  | `/api/applications/:id`                               | `{ status, ownerPhone? }`; owner only; emits system messages                                                                                                                                                                                                                   |
| POST   | `/api/applications/:id/withdraw`                      | Applicant withdraw + system message                                                                                                                                                                                                                                            |
| POST   | `/api/applications/:id/messages`                      | `{ text }`; sender from session                                                                                                                                                                                                                                                |
| POST   | `/api/applications/:id/phone`                         | `{ phoneNumber }` phone-share system message                                                                                                                                                                                                                                   |
| POST   | `/api/applications/:id/video-call`                    | `{ startsAt, durationMinutes, counter? }` request/counter                                                                                                                                                                                                                      |
| POST   | `/api/applications/:id/video-call/:messageId/accept`  | Accept a proposal                                                                                                                                                                                                                                                              |
| POST   | `/api/applications/:id/video-call/:messageId/decline` | Decline a proposal                                                                                                                                                                                                                                                             |

### Prefs, uploads _(Better Auth session)_

| Method     | Path                                    | Notes                                                      |
| ---------- | --------------------------------------- | ---------------------------------------------------------- |
| GET        | `/api/prefs`                            | Saved sits, archives, blocks, reports                      |
| GET        | `/api/prefs/saved/listings`             | Saved sit listings; `availability=open` (default) or `all` |
| PUT/DELETE | `/api/prefs/saved/:sitId`               | Toggle saved listing                                       |
| PUT/DELETE | `/api/prefs/archived-conversations/:id` | Archive conversation                                       |
| PUT/DELETE | `/api/prefs/archived-sits/:sitId`       | Archive sit                                                |
| POST       | `/api/prefs/blocks`                     | `{ name, image }`                                          |
| DELETE     | `/api/prefs/blocks/:name`               | Unblock                                                    |
| POST       | `/api/prefs/reports`                    | User report                                                |
| POST       | `/api/uploads`                          | multipart `file` → R2; returns `{ url }`                   |
| GET        | `/api/files/:key`                       | Serve uploaded object                                      |

### Profile, reviews, notifications _(Better Auth session)_

| Method | Path                          | Notes                                         |
| ------ | ----------------------------- | --------------------------------------------- |
| GET    | `/api/me`                     | `{ user, profile }` (creates profile row)     |
| GET    | `/api/me/profile`             | Current member profile                        |
| PUT    | `/api/me/profile`             | Patch profile fields                          |
| DELETE | `/api/me`                     | Delete account + owned vessels/apps/reviews   |
| GET    | `/api/profiles/:name`         | Public profile by display name                |
| GET    | `/api/notifications`          | Inbox for the signed-in user (`read` boolean) |
| POST   | `/api/notifications/read-all` | Mark every notification as read               |
| POST   | `/api/notifications/:id/read` | Mark one notification as read                 |
| GET    | `/api/reviews?sitter=`        | Reviews for a sitter                          |
| GET    | `/api/reviews?applicationId=` | One review or null                            |
| POST   | `/api/reviews`                | Owner leaves a review                         |
| POST   | `/api/reviews/:id/response`   | Sitter responds                               |

### Support

| Method | Path           | Notes                             |
| ------ | -------------- | --------------------------------- |
| POST   | `/api/support` | `{ topic, name, email, message }` |

## Dev console — http://localhost:5173/api/dev

Browser page to exercise everything. Create flow: **Load sample vessel + sit** →
**Save vessel** → **Save sit** (the sit references the vessel by `boatId`, so
order matters) → **GET /api/boats** to see the joined listing. **Reset + reseed**
(needs the admin token) restores seed data.

The whole `/api/dev` router 404s when `ENVIRONMENT=production`.

### Why `run_worker_first` matters

`wrangler.json` sets `assets.run_worker_first: ["/api/*"]`. Without it the SPA
fallback answers browser navigations to `/api/...` with `index.html`, so the app
renders instead of the API responding.

## Seed data

`src/worker/db/seed-data.ts` is the single source of truth (vessels + sits +
applications). `scripts/seed.sql` is generated from it — don't edit by hand:

```bash
npm run db:seed:generate
```

The dev-console reset endpoint reads the same `seed-data.ts`, so CLI and console
never drift.

## Verifying the SQL layer

```bash
npm run db:verify
```

Applies both migrations + the seed to an in-memory SQLite database (D1 _is_
SQLite) and asserts the join, FK integrity/cascade, application nesting, and the
owner/applicant/sit application queries. 27 checks.

## Auth

Google OAuth via Better Auth sets a session cookie. Write routes use
`requireUser` and stamp ownership / applicant identity from the session, not the
client body. See **AUTH.md** for remaining gaps (email/password, Apple, etc.).
