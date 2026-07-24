import { expect, test } from "@playwright/test";

test.describe("listing non-smoking highlight", () => {
  test("shows non-smoking when the sit requires non-smokers", async ({ page }) => {
    await page.goto("/boats/seed-sit-2");

    const item = page.getByTestId("detail-non-smoking");
    await expect(item).toBeVisible();
    await expect(item).toHaveText("Non-smoking");
  });

  test("hides non-smoking when smoking is allowed", async ({ page }) => {
    await page.goto("/boats/solstice");

    await expect(page.getByTestId("detail-non-smoking")).toHaveCount(0);
  });
});
