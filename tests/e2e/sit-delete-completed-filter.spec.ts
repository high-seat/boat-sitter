import { expect, test } from "@playwright/test";
import { seedVerifiedOwner } from "./helpers/auth";
import { seedDevFixture } from "./helpers/fixtures";

test.describe("owner sit delete and older completed filter", () => {
  test("warns when deleting a sit with an accepted applicant", async ({ page }) => {
    await seedVerifiedOwner(page);
    await seedDevFixture(page, "accept-solstice");
    await page.goto("/my-sits");
    await expect(page.getByRole("heading", { name: /My sits/i })).toBeVisible();

    const sitCard = page.getByTestId("owner-sit-card-solstice");
    await expect(sitCard).toBeVisible();

    await sitCard.getByTestId("owner-sit-actions-solstice").click();
    await page
      .getByTestId("owner-sit-actions-menu-solstice")
      .getByTestId("owner-sit-delete-solstice")
      .click();

    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByText(/Someone has already been accepted.*inform them/i)).toBeVisible();
    await page.getByRole("button", { name: /Cancel/i }).click();
  });

  test("hides completed sits older than 7 days until the checkbox is checked", async ({ page }) => {
    await seedVerifiedOwner(page);
    await seedDevFixture(page, "completed-sit");

    await page.goto("/my-sits");
    await expect(page.getByRole("heading", { name: /My sits/i })).toBeVisible();

    const completedId = "sit-completed-archive-e2e";
    await expect(page.getByTestId(`owner-sit-card-${completedId}`)).toHaveCount(0);
    await expect(page.getByTestId("owner-sits-phase-stayCompleted")).toHaveCount(0);

    const olderToggle = page.getByTestId("owner-sits-show-older-completed");
    await expect(olderToggle).toBeVisible();
    await olderToggle.getByRole("checkbox").check();

    const completedSection = page.getByTestId("owner-sits-phase-stayCompleted");
    await expect(completedSection).toBeVisible();
    await expect(completedSection.getByTestId(`owner-sit-card-${completedId}`)).toBeVisible();

    // Completed sits have no overflow menu (listing unpublished; no archive).
    await expect(completedSection.getByTestId(`owner-sit-actions-${completedId}`)).toHaveCount(0);
  });

  test("completed sit details page has no overflow actions", async ({ page }) => {
    await seedVerifiedOwner(page);
    await seedDevFixture(page, "completed-sit");

    await page.goto("/owner/sits/sit-completed-archive-e2e/applications");
    await expect(page.getByTestId("active-sit-chat")).toBeVisible();
    await expect(page.getByText(/^Sit completed$/i).first()).toBeVisible();
    await expect(page.getByTestId("active-sit-more-actions")).toHaveCount(0);
  });
});
