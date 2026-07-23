import { expect, test } from "@playwright/test";

test.describe("scroll to top on navigate", () => {
  test("resets window scroll when switching screens", async ({ page }) => {
    await page.goto("/boats");
    await expect(page.getByTestId("nav-find")).toBeVisible();

    await page.evaluate(() => {
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" });
    });
    await expect.poll(async () => page.evaluate(() => window.scrollY)).toBeGreaterThan(200);

    await page.getByTestId("nav-how").click();
    await expect(page).toHaveURL(/\/how-it-works$/);
    await expect.poll(async () => page.evaluate(() => window.scrollY)).toBe(0);
  });
});
