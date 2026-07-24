import { expect, test } from "@playwright/test";
import { seedOwnerSession, seedVerifiedOwner } from "./helpers/auth";
import { LIFECYCLE_SIT_ID, seedDevFixture, seedLifecycleSit } from "./helpers/fixtures";

test.describe("sit schedule progress on cards", () => {
  test("shows days until start for applicant-accepted sits", async ({ page }) => {
    await seedVerifiedOwner(page);
    await seedLifecycleSit(page, "accepted");

    await page.goto("/my-sits");

    const progress = page.getByTestId(`owner-sit-schedule-progress-${LIFECYCLE_SIT_ID}`);
    await expect(progress).toBeVisible();
    await expect(progress).toHaveText(/^Starts in \d+ days?$/);
    await expect(progress).not.toHaveText(/Starts in 0 day/);
  });

  test("shows day-of-total for underway sits", async ({ page }) => {
    await seedVerifiedOwner(page);
    await seedLifecycleSit(page, "underway");

    await page.goto("/my-sits");

    const progress = page.getByTestId(`owner-sit-schedule-progress-${LIFECYCLE_SIT_ID}`);
    await expect(progress).toBeVisible();
    // lifecycle underway: started 2 days ago, 14 nights → day 3 of 15
    await expect(progress).toHaveText("Sit 3 of 15 days");
  });

  test("shows day progress on the sitter card for underway sits", async ({ page, browser }) => {
    const ownerContext = await browser.newContext();
    const ownerPage = await ownerContext.newPage();
    await seedVerifiedOwner(ownerPage);
    await seedDevFixture(ownerPage, "underway-sit");
    await ownerContext.close();

    await seedOwnerSession(page, {
      name: "Alex Morgan",
      email: "alex.morgan@boatstead.mock",
      image: "https://i.pravatar.cc/160?img=11",
      phoneNumber: "7700900123",
      verified: true,
    });

    await page.goto("/my-sits");

    const progress = page.getByTestId("sitter-sit-schedule-progress-sit-underway-emergency-e2e");
    await expect(progress).toBeVisible();
    await expect(progress).toHaveText(/^Sit \d+ of \d+ days$/);
  });
});
