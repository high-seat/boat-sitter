import { expect, test } from "@playwright/test";
import { seedOwnerSession, seedVerifiedOwner } from "./helpers/auth";
import { seedDevFixture } from "./helpers/fixtures";

test.describe("end sit early", () => {
  test("owner can end an underway sit early and leave a review", async ({ page, browser }) => {
    await seedVerifiedOwner(page);
    await seedDevFixture(page, "underway-sit");

    await page.goto("/owner/sits/sit-underway-emergency-e2e/applications");
    await expect(page.getByTestId("active-sit-chat")).toBeVisible();
    await expect(page.getByTestId("active-sit-end-early")).toBeVisible();
    await expect(page.getByText(/^Sit underway$/i).first()).toBeVisible();

    await page.getByTestId("active-sit-end-early").click();
    const dialog = page.getByTestId("end-sit-early-confirm");
    await expect(dialog.getByRole("heading", { name: /End this sit early/i })).toBeVisible();
    await dialog.getByRole("button", { name: /Yes, end sit early/i }).click();

    await expect(page.getByTestId("applications-subtitle")).toContainText(/review/i);
    await expect(page.getByText(/^Sit completed$/i).first()).toBeVisible();
    await expect(page.getByTestId("active-sit-end-early")).toHaveCount(0);
    await expect(page.getByTestId("active-sit-cancel")).toHaveCount(0);
    // Completed sits have no overflow actions (listing is unpublished).
    await expect(page.getByTestId("active-sit-more-actions")).toHaveCount(0);
    await expect(page.getByTestId("leave-review-form-owner")).toBeVisible();
    await expect(
      page
        .getByTestId("conversation-messages")
        .getByText(/You ended this sit early with Alex Morgan/i)
        .first(),
    ).toBeVisible();

    const reviewForm = page.getByTestId("leave-review-form-owner");
    await reviewForm
      .locator("textarea")
      .fill("Alex took excellent care of the boat and kept us updated throughout the sit.");
    await reviewForm.getByTestId("leave-review-submit-owner").click();
    await expect(page.getByTestId("leave-review-form-owner")).toHaveCount(0);
    const reviewPreview = page.getByTestId("review-preview-owner");
    await expect(reviewPreview).toBeVisible();
    await expect(reviewPreview).toContainText(/You reviewed Alex Morgan/i);
    await expect(reviewPreview).toContainText(
      /Alex took excellent care of the boat and kept us updated throughout the sit/i,
    );

    const sitterContext = await browser.newContext();
    const sitterPage = await sitterContext.newPage();
    await seedOwnerSession(sitterPage, {
      name: "Alex Morgan",
      email: "alex.morgan@boatstead.mock",
      image: "https://i.pravatar.cc/160?img=11",
      phoneNumber: "7700900123",
      verified: true,
    });

    await sitterPage.goto("/messages?application=application-underway-emergency-e2e");
    await expect(
      sitterPage.getByTestId("conversation-messages").getByText(/This sit was completed early/i),
    ).toBeVisible();
    await expect(sitterPage.getByTestId("leave-review-form-sitter")).toBeVisible();

    await sitterPage.goto("/");
    await sitterPage.getByRole("button", { name: /Open notifications/i }).click();
    const menu = sitterPage.getByRole("menu", { name: /Notifications/i });
    await expect(menu.getByText(/ended the sit for/i).first()).toBeVisible();

    await sitterContext.close();
  });

  test("owner can end sit early from My sits actions menu", async ({ page }) => {
    await seedVerifiedOwner(page);
    await seedDevFixture(page, "underway-sit");

    await page.goto("/my-sits");
    const card = page.getByTestId("owner-sit-card-sit-underway-emergency-e2e");
    await expect(card).toBeVisible();
    await card.getByTestId("owner-sit-actions-sit-underway-emergency-e2e").click();
    const actionsMenu = page.getByTestId("owner-sit-actions-menu-sit-underway-emergency-e2e");
    await expect(actionsMenu.getByTestId("owner-sit-end-early")).toBeVisible();
    await actionsMenu.getByTestId("owner-sit-end-early").click();

    const dialog = page.getByTestId("end-sit-early-confirm");
    await dialog.getByRole("button", { name: /Yes, end sit early/i }).click();

    const completedSection = page.getByTestId("owner-sits-phase-stayCompleted");
    await expect(completedSection).toBeVisible();
    await expect(
      completedSection.getByTestId("owner-sit-card-sit-underway-emergency-e2e"),
    ).toBeVisible();
    await expect(
      completedSection
        .getByTestId("owner-sit-card-sit-underway-emergency-e2e")
        .getByTestId("sit-emergency-help"),
    ).toHaveCount(0);
  });
});
