# Boat Sitter API

Hono on Cloudflare Workers, backed by D1 via Drizzle.

## Setup

```bash
npm install

# Create the database, then paste the returned database_id into wrangler.json
npx wrangler d1 create boat-sitter-db

npm run db:migrate:local
npm run db:seed:local
npm run dev
```

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

## Verifying the SQL layer

```bash
python3 scripts/verify_sql.py
```

Runs the migration and seed against an in-memory SQLite database (D1 *is*
SQLite) and asserts the filter, search, sort, pagination and facet queries
return what the routes expect.
