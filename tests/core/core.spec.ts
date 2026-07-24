import { expect, test } from "@playwright/test";

/**
 * CORE test — the single "is the product usable?" check, run against the
 * DEPLOYED environment (staging + prod) after every deploy. If this fails, the
 * deploy is bad. Kept to exactly one case on purpose; we grow it deliberately.
 *
 * Core (today) = "a user can sign in and get a real session." One sign-in
 * exercises the whole critical stack: the Worker is up and serving the SPA,
 * Better Auth is mounted, D1 has the users/sessions tables, and the session
 * cookie round-trips (verified via /api/me).
 *
 * Uses the app's own email + password login (real Google OAuth can't be
 * reliably or permissibly automated). Credentials come from a dedicated test
 * account:  TEST_USER_EMAIL / TEST_USER_PASSWORD.
 *   - Locally without creds → skips.
 *   - In CI without creds → fails, so the gate is never silently a no-op.
 */

const email = process.env.TEST_USER_EMAIL;
const password = process.env.TEST_USER_PASSWORD;

test("core: a user can sign in", async ({ page }) => {
  test.skip(!process.env.CI && (!email || !password), "Set TEST_USER_EMAIL / TEST_USER_PASSWORD.");
  if (!email || !password) {
    throw new Error("TEST_USER_EMAIL / TEST_USER_PASSWORD must be set in CI for the core test.");
  }

  await page.goto("/");

  // The cookie-consent bar is also role="dialog" — dismiss it so it doesn't
  // clash with the auth modal (and so it can't overlap the form).
  const consent = page.getByRole("dialog", { name: /cookie consent/i });
  if (await consent.isVisible().catch(() => false)) {
    await consent.getByRole("button", { name: /decline/i }).click();
  }

  await page
    .getByRole("button", { name: /Log in/i })
    .first()
    .click();

  // Scope to the auth modal specifically (labelled "… Boatstead").
  const dialog = page.getByRole("dialog", { name: /Boatstead/i });
  await expect(dialog).toBeVisible();
  await dialog.locator('input[type="email"]').fill(email);
  await dialog.locator('input[type="password"]').fill(password);
  await dialog.getByRole("button", { name: /^Log in$/i }).click();

  // A real session must exist: /api/me returns our user (context carries the cookie).
  await expect(async () => {
    const me = await page.request.get("/api/me");
    expect(me.ok()).toBeTruthy();
    const body = (await me.json()) as { user?: { email?: string } | null };
    expect(body.user?.email?.toLowerCase()).toBe(email.toLowerCase());
  }).toPass({ timeout: 20_000 });
});
