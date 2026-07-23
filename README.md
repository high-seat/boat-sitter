# Boatstead

Boatstead connects boat owners with experienced sitters. The React SPA talks to a Hono API on Cloudflare Workers (D1). Auth uses Better Auth (Google OAuth and email/password). Domain data (boats, sits, applications, prefs, etc.) is API-only — there is no localStorage fallback for listings.

## Stack

- React, TypeScript, Vite, and Tailwind CSS
- Hono API running on Cloudflare Workers + D1 (Drizzle)
- Better Auth (Google OAuth + email/password)
- TanStack Query and Zustand
- i18next for localization
- pnpm for package management

## Development

```bash
pnpm install
cp .dev.vars.example .dev.vars
pnpm db:migrate:local
pnpm db:seed:local
pnpm dev
```

The frontend lives in `src/react-app`, and the Worker API entrypoint lives in `src/worker`. See `API.md` for endpoints. Local/Playwright sessions can use `POST /api/dev/login`.

## Verification

```bash
pnpm check
```

## Deployment

Authenticate Wrangler with Cloudflare, then run:

```bash
pnpm build
pnpm deploy
```
