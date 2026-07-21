# Boat Sitter API

Hono on Cloudflare Workers, backed by D1 via Drizzle.

## Setup

```bash
npm install
cp .dev.vars.example .dev.vars

npm run db:migrate:local
npm run db:seed:local
npm run dev
```

Then open **http://localhost:5173/api/dev** for the API console.

The D1 database (`boat-sitter-db`) already exists and its id is in
`wrangler.json`. To create one from scratch instead:
`npx wrangler d1 create boat-sitter-db` and paste the returned `database_id`.

Admin token for write endpoints:

```bash
# local: put ADMIN_TOKEN=dev-token in .dev.vars
echo 'ADMIN_TOKEN=dev-token' > .dev.vars

# production
npx wrangler secret put ADMIN_TOKEN
```

Deploy:

```bash
npm run db:migrate:remote
npm run db:seed:remote   # optional — dev data only
npm run build && npm run deploy
```

## Dev console

**http://localhost:5173/api/dev**

A browser page for exercising every endpoint — no curl or Postman needed. It has
filter inputs wired to `GET /api/boats`, a JSON editor for create/update, and a
response pane showing status code, latency and body.

Typical loop for testing a create:

1. Open `/api/dev`, confirm the admin token field matches your `.dev.vars`
2. Click **Load sample payload** — generates a valid boat with a unique id
3. Edit the JSON if you like, click **POST /api/boats**
4. Click **GET /api/boats** to see it in the list
5. **Reset + reseed database** puts things back

Supporting endpoints:

| Endpoint | Purpose |
|---|---|
| `GET /api/dev` | The console page |
| `GET /api/dev/status` | Row count, environment, whether `ADMIN_TOKEN` is set |
| `GET /api/dev/sample` | A valid boat payload with a fresh id |
| `POST /api/dev/reset` *(admin)* | Wipe and re-seed from `seed-data.ts` |

The entire `/api/dev` router returns `404` when `ENVIRONMENT=production`, so it
cannot be reached on a real deploy. Set that var before shipping.

## Endpoints

### `GET /api/boats`

Lists published boats.

| Param | Type | Notes |
|---|---|---|
| `region` | string | Exact match, e.g. `Mediterranean` |
| `country` | string | Exact match |
| `type` | string | e.g. `Catamaran` |
| `featured` | `true` \| `false` | |
| `minRating` | number | 0–5 |
| `availableFrom` | `YYYY-MM-DD` | listings starting on/after |
| `availableTo` | `YYYY-MM-DD` | listings starting on/before |
| `q` | string | matches name, location, country, description |
| `sort` | enum | `dateStart` (default), `-dateStart`, `rating`, `-rating`, `applicants`, `-applicants`, `name` |
| `page` | int | default 1 |
| `limit` | int | default 12, max 50 |

```json
{
  "data": [{ "id": "solstice", "name": "Solstice", "...": "..." }],
  "meta": { "page": 1, "limit": 12, "total": 5, "totalPages": 1, "hasMore": false }
}
```

```bash
curl 'http://localhost:5173/api/boats?region=Caribbean&sort=-rating'
curl 'http://localhost:5173/api/boats?q=catamaran'
curl 'http://localhost:5173/api/boats?availableFrom=2026-11-01&limit=2&page=2'
```

### `GET /api/boats/facets`

Distinct filter values with counts, for building the filter UI.

```json
{
  "regions": [{ "value": "Caribbean", "count": 1 }],
  "countries": [{ "value": "Grenada", "count": 1 }],
  "types": [{ "value": "Catamaran", "count": 1 }]
}
```

### `GET /api/boats/:id`

Single listing. `404` if missing or unpublished.

### `POST /api/boats` *(admin)*

Requires `Authorization: Bearer $ADMIN_TOKEN`. Body validated with Zod; see
`boatBodySchema` in `src/worker/routes/boats.ts`. `409` if the id already exists.

### `PATCH /api/boats/:id` *(admin)*

Partial update. `id` cannot be changed.

### `DELETE /api/boats/:id` *(admin)*

## Data model note

`gallery`, `responsibilities`, `systems`, `requirements` and `amenities` are JSON
text columns, not child tables. This data is always read as a whole listing and
never joined against, so normalising it would add joins for no benefit. If you
later need to filter by a specific amenity at scale, promote `amenities` to its
own table plus a join table.

## Seed data

`src/worker/db/seed-data.ts` is the single source of truth. `scripts/seed.sql`
is generated from it — do not edit that file by hand:

```bash
npm run db:seed:generate   # seed-data.ts  ->  scripts/seed.sql
```

This keeps the CLI seed and the dev-console reset endpoint from drifting apart.

## Verifying the SQL layer

```bash
npm run db:verify
```

Runs the migration and seed against an in-memory SQLite database (D1 *is*
SQLite) and asserts the filter, search, sort, pagination and facet queries
return what the routes expect.
