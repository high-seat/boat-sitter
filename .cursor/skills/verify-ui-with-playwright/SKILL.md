---
name: verify-ui-with-playwright
description: >-
  Verifies every Boatstead UI change in a real browser using the Playwright
  MCP, posts English screenshots of the feature in its different states into
  the chat for review, and keeps automated Playwright specs in tests/e2e in
  sync. Requires data-testid on elements under test and getByTestId in specs.
  Use automatically after changing components, pages, routes, forms,
  interactions, responsive behavior, or CSS in this repository. Do not call a
  UI task complete until the affected flow has been exercised visually,
  English screenshots of its states are shown in chat, and matching e2e
  coverage exists or has been updated.
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
4. **Add `data-testid` attributes for every element a Playwright spec targets,**
   and **update those specs to select via `getByTestId(...)`.** Do this in the
   same change as the UI work. Prefer kebab-case ids scoped by feature
   (e.g. `sit-emergency-help`, `conversation-messages`,
   `vessel-feature-group-life-aboard`). Do not rely on visible copy, CSS
   classes, or fragile DOM structure as the primary locator for automated
   assertions or clicks. Roles and labels remain fine for MCP exploratory
   checks and accessibility, but e2e specs should pin behavior with test ids.
5. When changing copy, layout, or nesting around an existing tested control,
   keep or refresh its `data-testid` and migrate any leftover role/text
   selectors in `tests/e2e` to `getByTestId`.
6. Run the affected specs with `pnpm test:e2e` (or
   `pnpm exec playwright test path/to/spec`) before calling the task done.
7. Keep MCP visual checks for layout, responsive German stress-testing, and
   exploratory QA; keep `tests/e2e` for repeatable regression coverage of
   critical flows. Chat review screenshots stay English-only.

### Test id conventions

- Use `data-testid="…"` in React (not ad-hoc `data-*` attrs invented per
  feature unless they are also the Playwright test id).
- Name by domain + purpose: `feature-element`, not `button1` or `div`.
- For lists/groups, put the id on the stable container the test scopes into
  (group, panel, row), and on interactive controls the test clicks or asserts.
- Existing examples: `sit-emergency-help`, `conversation-messages`,
  `email-confirmation-status`.

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
5. When testing changes, also stress-test in German (longer copy can break
   layouts). Switch the footer `LanguageSelect` to **Deutsch** (`de`), re-run
   the affected flow at mobile width especially, and look for truncation,
   overflow, wrapping that breaks buttons/nav, and clipped labels. Save any
   German layout-check captures with a `-de` suffix only as local artifacts
   (e.g. `feature-mobile-de.png`); do **not** post German screenshots in chat
   for review.
6. **Always show review screenshots in English.** Before capturing screenshots
   that will be posted in chat, set the UI language to **English (US)**
   (`en-US`) via the footer `LanguageSelect` (or ensure it is already
   selected). Every screenshot shown to the user for visual review must be in
   English, regardless of any German (or other-locale) layout checks you also
   ran.
7. Check:
   - Layout, spacing, alignment, typography, and image loading.
   - Overflow and clipping with narrow screens and long content.
   - Keyboard operation, focus behavior, modals, and form validation.
   - Route transitions and persisted localStorage state.
   - Loading, empty, error, and successful mutation states where relevant.
8. Update or add `tests/e2e` coverage for the same change: add `data-testid`s on
   targeted UI, point specs at `getByTestId`, then run the affected Playwright
   specs.
9. Fix any issue found, then repeat the affected browser flow and screenshot.
10. **Post screenshots in chat for review** before calling the feature done (see
    below). Saving files under `.artifacts/playwright/` alone is not enough.
    Those review screenshots must be in English (see workflow step 6).

## Post screenshots in chat for review

After developing a feature (or finishing a UI change), put Playwright
screenshots of it in its different states into the chat so they can be reviewed.

1. Switch the UI to **English (US)** before any screenshot that will be shown
   in chat. Do not post German (or other non-English) screenshots for review.
2. Capture via Playwright MCP `browser_take_screenshot` for each meaningful
   state the change introduces or touches. Typical set when applicable:
   - Default / resting
   - Empty
   - Loading / shimmer
   - Filled / success
   - Error / validation
   - Open modal, menu, or expanded panel
   - Desktop and mobile
   - Count copy: when UI shows countable nouns, capture or e2e-assert both
     singular (`1 …`) and plural (`2 …`) so forms like `1 applicants` cannot
     ship (see `translate-user-facing-strings`)
3. Save under `.artifacts/playwright/` with clear names
   (e.g. `cancel-sit-dialog-open-desktop.png`). German layout-check artifacts
   may use a `-de` suffix but stay local only.
4. Show the English screenshots in the chat: use the MCP screenshot result
   and/or Read each saved image path so the images appear inline for the user.
   Label each with state and viewport.
5. Do not mark the UI task complete until the relevant states have been
   screenshotted in English and posted in chat (unless the Playwright MCP was
   unavailable — then report that blocker explicitly).

## Minimum route coverage

Choose routes relevant to the change:

- `/` — homepage search and navigation
- `/boats` — filters and destination autocomplete
- `/boats/solstice` — listing details and application flow
- `/members/me` — sitter/owner profile, reviews, verification
- `/owner/boats` — owner create, edit, and delete flows (including sit creation)
- `/saved` — persisted saved listings

## Reporting

State which route, viewport, interaction, and e2e specs were verified or
updated. Mention if a German layout stress-check was also run. Include the
in-chat **English** screenshots of the feature in its different states so the
user can review appearance without opening artifact paths. Never claim a
visual check occurred if the Playwright MCP was unavailable or could not
connect; report that blocker explicitly. Never claim e2e coverage was updated
if `tests/e2e` was left unchanged for a flow that has or should have automated
tests.
