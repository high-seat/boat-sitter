import { expect, test } from "@playwright/test";

test.describe("listing experience requested", () => {
  test("shows empty message when no special requirements are set", async ({ page }) => {
    await page.goto("/boats/saltwood");

    const empty = page.getByTestId("listing-experience-empty");
    await expect(empty).toBeVisible();
    await expect(empty).toHaveText("No special requirements needed");
    await expect(page.getByTestId("listing-experience-list")).toHaveCount(0);
  });

  test("shows experience chips when requirements are set", async ({ page }) => {
    await page.goto("/boats/solstice");

    const list = page.getByTestId("listing-experience-list");
    await expect(list).toBeVisible();
    await expect(list.locator("span").first()).toBeVisible();
    await expect(page.getByTestId("listing-experience-empty")).toHaveCount(0);
  });
});
