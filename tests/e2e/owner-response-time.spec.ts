import { expect, test } from "@playwright/test";

test.describe("owner response time on sit detail", () => {
  test("shows bucketed usual response time from chat averages", async ({ page }) => {
    await page.goto("/boats/solstice");

    const responseTime = page.getByTestId("owner-response-time");
    await expect(responseTime).toBeVisible();
    await expect(responseTime).toHaveText(/Usually responds within 2 hours/i);
  });

  test("hides response time when the owner has no chat replies", async ({ page }) => {
    await page.goto("/boats/blue-hour");

    await expect(page.getByTestId("listing-boat-name")).toHaveText("Blue Hour");
    await expect(page.getByTestId("owner-response-time")).toHaveCount(0);
  });
});
