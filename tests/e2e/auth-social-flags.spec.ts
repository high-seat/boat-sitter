import { expect, test } from "@playwright/test";

test.describe("auth social providers", () => {
  test("hides Apple and Facebook login while feature flags are off", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /Log in/i }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("button", { name: /Continue with Google/i })).toBeVisible();
    await expect(dialog.getByRole("button", { name: /Continue with Apple/i })).toHaveCount(0);
    await expect(dialog.getByRole("button", { name: /Continue with Facebook/i })).toHaveCount(0);
  });

  test("shows terms agreement on signup only, not login", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /Log in/i }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    const terms = dialog.locator('label:has(a[href="/terms"])');
    await expect(terms).toHaveCount(0);

    await dialog.getByRole("button", { name: /^Sign up$/i }).click();
    await expect(terms).toBeVisible();
    await expect(terms.getByRole("checkbox")).not.toBeChecked();

    await dialog.getByRole("button", { name: /^Log in$/i }).click();
    await expect(terms).toHaveCount(0);
  });
});
