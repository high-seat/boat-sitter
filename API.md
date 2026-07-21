# Boat Sitter API

Hono on Cloudflare Workers, backed by D1 via Drizzle. The React app talks to it
entirely through `src/react-app/mockApi.ts` (kept that filename so imports didn't
change; it is no longer a mock).

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

| Method | Path             | Notes                                             |
| ------ | ---------------- | ------------------------------------------------- |
| GET    | `/api/boats`     | All published listings, vessel ⋈ sit              |
| GET    | `/api/boats/:id` | One listing by sit id; 404 if missing/unpublished |

### Owner — vessels & sits _(open today; see AUTH.md)_

| Method | Path                       | Notes                                        |
| ------ | -------------------------- | -------------------------------------------- |
| GET    | `/api/vessels` · `?owner=` | List (optionally by owner)                   |
| GET    | `/api/vessels/:id`         | One vessel                                   |
| PUT    | `/api/vessels/:id`         | Upsert (create or update)                    |
| DELETE | `/api/vessels/:id`         | 409 `VESSEL_HAS_SITS` if sits reference it   |
| GET    | `/api/sits`                | List (sits expose `boatId` = vessel id)      |
| PUT    | `/api/sits/:id`            | Upsert; 400 if `boatId` vessel doesn't exist |
| DELETE | `/api/sits/:id`            |                                              |

### Applications _(open today; see AUTH.md)_

| Method | Path                             | Notes                                                            |
| ------ | -------------------------------- | ---------------------------------------------------------------- |
| GET    | `/api/applications?sitId=`       | Applications for one listing                                     |
| GET    | `/api/applications?user=`        | Where user is owner **or** applicant                             |
| POST   | `/api/applications`              | `{ sitId, message, applicant }`; idempotent per (sit, applicant) |
| PATCH  | `/api/applications/:id`          | `{ status }` (new/shortlisted/accepted/declined)                 |
| POST   | `/api/applications/:id/messages` | `{ senderName, text }`                                           |

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

Identity is still client-supplied — writes are open. See **AUTH.md** for the plan
to close this with Better Auth before real users. Do not expose write endpoints
on a public URL until that lands.
