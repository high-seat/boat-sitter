import { expect, test } from "@playwright/test";

/**
 * CORE test — boat listing works end to end, run against the DEPLOYED
 * environment (staging + prod) after every deploy.
 *
 * "Listings load" is core functionality, so this covers both halves:
 *   1. the API — GET /api/boats returns 200 with a non-empty `data` array, and
 *   2. the UI  — the /boats page actually renders at least one boat card
 *      (each card is a link to /boats/:id).
 *
 * A green here means D1 has published sits+vessels, the boats query/join runs,
 * and the SPA fetches and paints them. Requires the environment to have boats
 * seeded (demo seed.sql on staging; real listings on prod).
 */

test("core: boat listing API works and the page shows boats", async ({ page }) => {
  // 1. API: the endpoint responds with at least one boat.
  const res = await page.request.get("/api/boats");
  expect(res.ok()).toBeTruthy();
  const body = (await res.json()) as { data?: unknown[] };
  expect(Array.isArray(body.data)).toBeTruthy();
  expect((body.data ?? []).length).toBeGreaterThan(0);

  // 2. UI: the browse page paints at least one boat card. Each card links to
  //    /boats/:id, so an anchor with that href prefix is a rendered listing.
  await page.goto("/boats");

  // Cookie-consent bar is role="dialog" — dismiss it if present so it can't
  // overlap the grid.
  const consent = page.getByRole("dialog", { name: /cookie consent/i });
  if (await consent.isVisible().catch(() => false)) {
    await consent.getByRole("button", { name: /decline/i }).click();
  }

  const cards = page.locator('a[href^="/boats/"]');
  await expect(cards.first()).toBeVisible({ timeout: 15_000 });
  expect(await cards.count()).toBeGreaterThan(0);
});
