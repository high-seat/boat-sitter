import { expect, test } from "@playwright/test";
import { seedOwnerSession } from "./helpers/auth";

// Seeded sessions (via /api/dev/login) are real Better Auth *credential*
// accounts whose password is the dev password below. These tests exercise the
// real change-password flow (Better Auth), which replaced the old localStorage
// mock that wrongly rejected real accounts.
const DEV_PASSWORD = "dev-password-boatstead";

test.describe("account credentials", () => {
  test("credential account can change its password", async ({ page }) => {
    await seedOwnerSession(page, { emailConfirmed: true });
    await page.goto("/settings?tab=security");

    await page.getByRole("button", { name: /Change password/i }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: /Change password/i })).toBeVisible();

    await dialog.getByLabel(/Current password/i).fill(DEV_PASSWORD);
    await dialog.getByLabel(/New password/i).fill("newpass12345");
    await dialog.getByLabel(/Confirm password/i).fill("newpass12345");
    await dialog.getByRole("button", { name: /Change password/i }).click();

    // On success the dialog closes (no error alert, no "email sign-up account").
    await expect(dialog).toBeHidden();
    await expect(page.getByText(/email sign-up account/i)).toHaveCount(0);
  });

  test("wrong current password is rejected with an error", async ({ page }) => {
    await seedOwnerSession(page, { emailConfirmed: true });
    await page.goto("/settings?tab=security");

    await page.getByRole("button", { name: /Change password/i }).click();
    const dialog = page.getByRole("dialog");

    await dialog.getByLabel(/Current password/i).fill("definitely-not-the-password");
    await dialog.getByLabel(/New password/i).fill("newpass12345");
    await dialog.getByLabel(/Confirm password/i).fill("newpass12345");
    await dialog.getByRole("button", { name: /Change password/i }).click();

    // Stays open and surfaces an error rather than silently succeeding.
    await expect(dialog.getByRole("alert")).toBeVisible();
  });

  test("change email asks only for a new email (no current-password prompt)", async ({ page }) => {
    await seedOwnerSession(page, { emailConfirmed: true });
    await page.goto("/settings?tab=security");

    await page.getByRole("button", { name: /Change email/i }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByLabel(/New email/i)).toBeVisible();
    // The old mock flow required a current password here; Better Auth doesn't.
    await expect(dialog.locator('input[type="password"]')).toHaveCount(0);
  });
});
