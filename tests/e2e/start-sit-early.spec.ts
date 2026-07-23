import { expect, test } from "@playwright/test";
import { seedOwnerSession, seedVerifiedOwner } from "./helpers/auth";
import { LIFECYCLE_SIT_ID, seedLifecycleSit } from "./helpers/fixtures";

function lifecycleOwnerCard(page: import("@playwright/test").Page) {
  return page
    .locator("article")
    .filter({ has: page.locator(`a[href*="/boats/${LIFECYCLE_SIT_ID}"]`) })
    .first();
}

test.describe("start sit early", () => {
  test("owner moves an accepted sit to underway from My sits", async ({ browser }) => {
    const ownerContext = await browser.newContext();
    const ownerPage = await ownerContext.newPage();
    await seedVerifiedOwner(ownerPage);
    await seedLifecycleSit(ownerPage, "accepted");

    const sitterContext = await browser.newContext();
    const sitterPage = await sitterContext.newPage();
    await seedOwnerSession(sitterPage, {
      name: "Alex Morgan",
      email: "alex.morgan@boatstead.mock",
      image: "https://i.pravatar.cc/160?img=11",
      phoneNumber: "7700900123",
      verified: true,
    });

    await ownerPage.goto("/my-sits");
    const ownerCard = lifecycleOwnerCard(ownerPage);
    await expect(ownerCard.getByText(/^Applicant accepted$/i)).toBeVisible();
    await ownerCard.getByRole("button", { name: /Start sit early/i }).click();

    const dialog = ownerPage.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: /Start this sit early/i })).toBeVisible();
    await dialog.getByRole("button", { name: /Yes, start early/i }).click();

    await expect(ownerCard.getByText(/^Sit underway$/i)).toBeVisible();
    await expect(ownerCard.getByRole("button", { name: /Start sit early/i })).toHaveCount(0);
    await expect(ownerCard.getByTestId("sit-emergency-help")).toBeVisible();

    await ownerPage.goto(`/owner/sits/${LIFECYCLE_SIT_ID}/applications`);
    await expect(ownerPage.getByRole("heading", { name: /Applications for/i })).toBeVisible();
    await expect(ownerPage.getByRole("button", { name: /Start sit early/i })).toHaveCount(0);
    const underwayStep = ownerPage.getByRole("listitem").filter({ hasText: /Sit underway/i });
    await expect(underwayStep).toHaveClass(/bg-seafoam/);

    await sitterPage.goto("/my-sits");
    const sitterCard = lifecycleOwnerCard(sitterPage);
    await expect(sitterCard.getByText(/^Sit underway$/i)).toBeVisible();

    await ownerContext.close();
    await sitterContext.close();
  });

  test("owner can start early from application review", async ({ page }) => {
    await seedVerifiedOwner(page);
    await seedLifecycleSit(page, "accepted");

    await page.goto(`/owner/sits/${LIFECYCLE_SIT_ID}/applications`);
    await expect(page.getByRole("heading", { name: /Applications for/i })).toBeVisible();
    await expect(page.getByText(/^Applicant accepted$/i).first()).toBeVisible();

    await page.getByRole("button", { name: /Start sit early/i }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: /Start this sit early/i })).toBeVisible();
    await dialog.getByRole("button", { name: /Yes, start early/i }).click();

    await expect(page.getByText(/^Sit underway$/i).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /Start sit early/i })).toHaveCount(0);
    await expect(page.getByTestId("sit-emergency-help").first()).toBeVisible();
  });
});
