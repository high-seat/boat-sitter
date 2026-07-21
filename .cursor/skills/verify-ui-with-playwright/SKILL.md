---
name: verify-ui-with-playwright
description: >-
  Verifies every Boatstead UI change in a real browser using the Playwright
  MCP. Use automatically after changing components, pages, routes, forms,
  interactions, responsive behavior, or CSS in this repository. Do not call a
  UI task complete until the affected flow has been exercised and visually
  inspected at desktop and mobile widths.
---

# Verify UI with Playwright

After every UI change, verify behavior and appearance in the running app.
Typechecks and builds are necessary but do not replace browser verification.

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
5. Check:
   - Layout, spacing, alignment, typography, and image loading.
   - Overflow and clipping with narrow screens and long content.
   - Keyboard operation, focus behavior, modals, and form validation.
   - Route transitions and persisted localStorage state.
   - Loading, empty, error, and successful mutation states where relevant.
6. Fix any issue found, then repeat the affected browser flow and screenshot.

## Minimum route coverage

Choose routes relevant to the change:

- `/` — homepage search and navigation
- `/boats` — filters and destination autocomplete
- `/boats/solstice` — listing details and application flow
- `/members/me` — sitter/owner profile, reviews, verification
- `/owner/boats` — owner create, edit, and delete flows
- `/saved` — persisted saved listings

## Reporting

State which route, viewport, and interaction were verified. Never claim a
visual check occurred if the Playwright MCP was unavailable or could not
connect; report that blocker explicitly.
