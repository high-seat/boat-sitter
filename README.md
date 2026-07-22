# Boatstead

Boatstead connects boat owners with experienced sitters. The React SPA talks to a Hono API on Cloudflare Workers (D1). Google sign-in uses Better Auth; when a real session cookie is present, boats/vessels/sits/applications/support go through the Worker. Mock email login and Playwright e2e still use the browser localStorage layer.

## Stack

- React, TypeScript, Vite, and Tailwind CSS
- Hono API running on Cloudflare Workers + D1 (Drizzle)
- Better Auth (Google OAuth)
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

The frontend lives in `src/react-app`, and the Worker API entrypoint lives in `src/worker`. See `API.md` for endpoints.

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
