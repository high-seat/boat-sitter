import { expect, test } from "@playwright/test";

test.describe("sit date year display", () => {
  test("omits the year for sits in the current calendar year", async ({ page }) => {
    await page.goto("/boats/sea-glass");
    const dates = page.getByTestId("listing-sit-dates");
    await expect(dates).toBeVisible();
    await expect(dates).toHaveText(/Aug 8\s*[–-]\s*Aug 22/);
    await expect(dates).not.toContainText("2026");
  });

  test("includes the year when the sit is not in the current calendar year", async ({ page }) => {
    await page.goto("/boats/northern-light");
    const dates = page.getByTestId("listing-sit-dates");
    await expect(dates).toBeVisible();
    await expect(dates).toHaveText(/Jan 5, 2027\s*[–-]\s*Feb 2, 2027/);
  });
});
