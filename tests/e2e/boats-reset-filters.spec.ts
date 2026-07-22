import { expect, test } from "@playwright/test";

test.describe("boats empty state", () => {
  test("resets filters from the empty results state", async ({ page }) => {
    await page.goto("/boats?q=zzzz-no-match-xyz&sitType=daytimeChecks");
    await expect(page.getByRole("heading", { name: /No boats on this tide/i })).toBeVisible();
    await page.getByRole("button", { name: /Reset filters/i }).click();
    await expect(page.getByRole("heading", { name: /No boats on this tide/i })).toHaveCount(0);
    await expect(page).toHaveURL(/\/boats\/?$/);
    await expect(page.getByLabel(/Sit type/i)).toHaveValue("all");
    await expect(page.getByText(/\d+ sits? found/i)).toBeVisible();
  });

  test("disables view and sort controls when there are no results", async ({ page }) => {
    await page.goto("/boats?q=zzzz-no-match-xyz");
    await expect(page.getByRole("heading", { name: /No boats on this tide/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /^List$/i })).toBeDisabled();
    await expect(page.getByRole("button", { name: /^Map$/i })).toBeDisabled();
    await expect(page.getByLabel(/Sort/i)).toBeDisabled();

    await page.getByRole("button", { name: /Reset filters/i }).click();
    await expect(page.getByRole("button", { name: /^List$/i })).toBeEnabled();
    await expect(page.getByRole("button", { name: /^Map$/i })).toBeEnabled();
    await expect(page.getByLabel(/Sort/i)).toBeEnabled();
  });
});
