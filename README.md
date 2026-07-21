# Boatstead

Boatstead connects boat owners with experienced sitters. The app currently uses a browser-persisted mock data layer while running as a React single-page application on Cloudflare Workers.

## Stack

- React, TypeScript, Vite, and Tailwind CSS
- Hono API running on Cloudflare Workers
- TanStack Query and Zustand
- i18next for localization
- pnpm for package management

## Development

```bash
pnpm install
pnpm dev
```

The frontend lives in `src/react-app`, and the Worker API entrypoint lives in `src/worker`.

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
