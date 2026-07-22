import { expect, test } from "@playwright/test";

test.describe("boat type URL param", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("i18nextLng", "en-US");
    });
  });

  test("writes slug vessel types in the search URL", async ({ page }) => {
    await page.goto("/boats");
    await page.getByLabel("Vessel", { exact: true }).selectOption("Motor yacht");
    await expect(page).toHaveURL(/[?&]type=motor-yacht(?:&|$)/);

    await page.goto("/boats?type=motor-yacht");
    await expect(page.getByLabel("Vessel", { exact: true })).toHaveValue("Motor yacht");
    await expect(
      page.getByRole("heading", { name: /Sea Glass|Northern Light/i }).first(),
    ).toBeVisible();
  });

  test("still accepts legacy type labels in the URL", async ({ page }) => {
    await page.goto("/boats?type=Motor+yacht");
    await expect(page.getByLabel("Vessel", { exact: true })).toHaveValue("Motor yacht");
  });
});
