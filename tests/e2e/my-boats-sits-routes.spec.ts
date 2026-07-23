import { expect, test } from "@playwright/test";
import { seedVerifiedOwner } from "./helpers/auth";

test.describe("my boats and my sits routes", () => {
  test("splits boats and sits dashboards onto separate URLs", async ({ page }) => {
    await seedVerifiedOwner(page);

    await page.goto("/my-sits");
    await expect(page).toHaveURL(/\/my-sits$/);
    await expect(page.getByRole("heading", { name: /My sits/i })).toBeVisible();
    await expect(page.locator('main a[href="/my-sits"]')).toHaveAttribute("aria-current", "page");

    await page.locator('main a[href="/my-boats"]').click();
    await expect(page).toHaveURL(/\/my-boats$/);
    await expect(page.getByRole("heading", { name: /My boats/i })).toBeVisible();
    await expect(page.locator('main a[href="/my-boats"]')).toHaveAttribute("aria-current", "page");

    await page.goto("/owner/boats");
    await expect(page).toHaveURL(/\/my-boats$/);
    await expect(page.getByRole("heading", { name: /My boats/i })).toBeVisible();
  });

  test("editor Back returns to the matching index", async ({ page }) => {
    await seedVerifiedOwner(page);

    await page.goto("/owner/boats/solstice-boat/edit");
    await expect(page.getByRole("heading", { name: /Edit Solstice/i })).toBeVisible();
    await page.getByRole("button", { name: /^Back$/i }).click();
    await expect(page).toHaveURL(/\/my-boats$/);
    await expect(page.getByRole("heading", { name: /My boats/i })).toBeVisible();

    await page.goto("/owner/sits/solstice/edit");
    await expect(page.getByRole("heading", { name: /Edit/i })).toBeVisible();
    await page.getByRole("button", { name: /^Back$/i }).click();
    await expect(page).toHaveURL(/\/my-sits$/);
    await expect(page.getByRole("heading", { name: /My sits/i })).toBeVisible();
  });
});
