import { expect, test } from "@playwright/test";
import { seedOwnerSession } from "./helpers/auth";

test.describe("sit also-looking social proof", () => {
  test("shows viewer count when sitAlsoLooking flag is on", async ({ page }) => {
    await seedOwnerSession(page, {
      featureFlags: { sitAlsoLooking: true },
    });
    await page.goto("/boats/solstice");

    const alsoLooking = page.getByTestId("sit-also-looking");
    await expect(alsoLooking).toBeVisible();
    await expect(alsoLooking).toHaveText(/\d+ people are also looking at this sit/);
  });

  test("hides viewer count when sitAlsoLooking flag is off", async ({ page }) => {
    await seedOwnerSession(page, {
      featureFlags: { sitAlsoLooking: false },
    });
    await page.goto("/boats/solstice");

    await expect(page.getByTestId("sit-also-looking")).toHaveCount(0);
  });
});
