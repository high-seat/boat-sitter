---
name: unit-test-utils-with-jest
description: >-
  Adds and runs Jest unit tests for Boatstead util/helper modules. Use
  automatically when adding, changing, or moving pure helpers under
  src/shared or *Utils / schedule / sort / format modules in src/react-app
  (or similar util files), including dateUtils, lengthUtils, sitSchedule,
  timeFormat, and other non-UI logic.
---

# Unit-test utils with Jest

Pure helpers get Jest coverage in `tests/unit`. Playwright covers UI flows; do
not use e2e for util regression.

## When adjusting utils

when adjusting utils etc, run the jest tetss

```bash
pnpm test:unit
```

Fix failures before calling the util change done. Prefer `pnpm test:unit -- path/to/file.test.ts` while iterating.

## When adding new utils

if adding new utils etc, add jest tests for them

1. Put the helper in `src/shared/` when shared with the worker, otherwise next to
   the app code that owns it (e.g. `src/react-app/*Utils.ts`).
2. Add `tests/unit/<name>.test.ts` covering happy path, invalid input, and
   boundary cases (pass `now` / other injectable clocks when the API allows).
3. Run `pnpm test:unit` and keep it green.

## Conventions

- Match `**/*.test.ts` under `tests/unit` only (Playwright owns `tests/e2e`).
- Import with relative paths from the test file into `src/…`, or `@/` for
  react-app modules (see `jest.config.cjs` `moduleNameMapper`).
- Keep tests free of network, D1, and React renderers; mock only when a util
  truly depends on an impure edge.
- Scripts: `pnpm test` / `pnpm test:unit` (same). Included in `pnpm check`.

## Checklist

- [ ] New/changed util has or updates a Jest test
- [ ] `pnpm test:unit` passes
- [ ] No Playwright spec added solely to assert pure helper math/string logic
