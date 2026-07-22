---
name: verify-ui-with-playwright
description: >-
  Verifies every Boatstead UI change in a real browser using the Playwright
  MCP, and keeps automated Playwright specs in tests/e2e in sync. Use
  automatically after changing components, pages, routes, forms, interactions,
  responsive behavior, or CSS in this repository. Do not call a UI task complete
  until the affected flow has been exercised visually and matching e2e coverage
  exists or has been updated.
---

# Verify UI with Playwright

After every UI change, verify behavior and appearance in the running app.
Typechecks and builds are necessary but do not replace browser verification.

For loading states, follow the `loading-shimmer` skill: use detailed layout
skeletons, not generic pulse blocks, and spot-check the skeleton in the browser
when feasible.

## Maintain automated e2e tests

When touching a user-facing flow, find the Playwright tests and update them. If
they are missing, add them.

1. Search `tests/e2e/` (and helpers under `tests/e2e/helpers/`) for specs that
   cover the changed route, component, or flow.
2. If matching tests exist, update them for the new behavior, copy, selectors,
   and assertions in the same change.
3. If coverage is missing, add or extend a focused spec under `tests/e2e/` and
   reuse helpers when possible (`helpers/auth.ts`, `helpers/sitEditor.ts`, etc.).
4. Prefer stable roles, labels, and user-visible text over brittle CSS selectors.
5. Run the affected specs with `pnpm test:e2e` (or
   `pnpm exec playwright test path/to/spec`) before calling the task done.
6. Keep MCP visual checks for layout, responsive German, and exploratory QA;
   keep `tests/e2e` for repeatable regression coverage of critical flows.

Current high-value coverage to extend rather than reinvent:

- `tests/e2e/sit-creation.spec.ts` — owner sit creation
- `tests/e2e/listing-modal-map-stacking.spec.ts` — apply modal vs map stacking

## Workflow

1. Check existing terminals before starting a server. If needed, run
   `pnpm dev --host 0.0.0.0`.
2. Read Vite's output and use the exact URL it reports. Ports 5174 and 5175
   may already be occupied; do not assume `localhost` points to Boatstead.
   Prefer the reported IPv4 address when another IPv6 localhost server exists.
3. Use the Playwright MCP to:
   - Navigate to every route affected by the change.
   - Exercise the changed interaction, including success and empty states.
   - Inspect browser console errors and failed network requests.
   - Take and inspect screenshots at desktop (~1440×900) and mobile
     (~390×844) viewport sizes.
   - Save every screenshot under `.artifacts/playwright/`. Never save generated
     screenshots or other verification artifacts in the repository root.
4. For authenticated states, press `Meta+K` (`Control+K` outside macOS) and
   select the relevant mock sitter or owner.
5. When testing changes, test in German too, which tends to be longer text and
   can break UIs. Switch the footer `LanguageSelect` to **Deutsch** (`de`),
   re-run the affected flow at mobile width especially, and look for truncation,
   overflow, wrapping that breaks buttons/nav, and clipped labels. Prefer
   German screenshots with a `-de` suffix (e.g. `feature-mobile-de.png`).
6. Check:
   - Layout, spacing, alignment, typography, and image loading.
   - Overflow and clipping with narrow screens and long content.
   - Keyboard operation, focus behavior, modals, and form validation.
   - Route transitions and persisted localStorage state.
   - Loading, empty, error, and successful mutation states where relevant.
7. Update or add `tests/e2e` coverage for the same change, then run the affected
   Playwright specs.
8. Fix any issue found, then repeat the affected browser flow and screenshot.

## Minimum route coverage

Choose routes relevant to the change:

- `/` — homepage search and navigation
- `/boats` — filters and destination autocomplete
- `/boats/solstice` — listing details and application flow
- `/members/me` — sitter/owner profile, reviews, verification
- `/owner/boats` — owner create, edit, and delete flows (including sit creation)
- `/saved` — persisted saved listings

## Reporting

State which route, viewport, locale (include German), interaction, and e2e
specs were verified or updated. Never claim a visual check occurred if the
Playwright MCP was unavailable or could not connect; report that blocker
explicitly. Never claim e2e coverage was updated if `tests/e2e` was left
unchanged for a flow that has or should have automated tests.
