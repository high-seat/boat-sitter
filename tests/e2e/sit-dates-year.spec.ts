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

  test("date range picker omits years for a current-year range", async ({ page }) => {
    const year = new Date().getFullYear();
    await page.goto(`/boats?from=${year}-08-08&to=${year}-08-22`);
    const dates = page.getByTestId("boats-dates");
    await expect(dates).toBeVisible();
    await expect(dates).toHaveText(/Aug 8\s*[–-]\s*Aug 22/);
    await expect(dates).not.toContainText(String(year));
  });

  test("date range picker shows years for a cross-year range", async ({ page }) => {
    const year = new Date().getFullYear();
    await page.goto(`/boats?from=${year}-12-30&to=${year + 1}-01-08`);
    const dates = page.getByTestId("boats-dates");
    await expect(dates).toBeVisible();
    await expect(dates).toHaveText(new RegExp(`Dec 30, ${year}\\s*[–-]\\s*Jan 8, ${year + 1}`));
  });
});
