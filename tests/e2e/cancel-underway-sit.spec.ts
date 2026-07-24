import { expect, test } from "@playwright/test";
import { seedOwnerSession, seedVerifiedOwner } from "./helpers/auth";
import { seedDevFixture } from "./helpers/fixtures";

test.describe("cancel underway sit", () => {
  test("cancel dialog from sit actions covers the dropdown", async ({ page }) => {
    await seedVerifiedOwner(page);
    await seedDevFixture(page, "underway-sit");

    await page.goto("/my-sits");
    const sitId = "sit-underway-emergency-e2e";
    const card = page.getByTestId(`owner-sit-card-${sitId}`);
    await expect(card).toBeVisible();

    await card.getByTestId(`owner-sit-actions-${sitId}`).click();
    const actionsMenu = page.getByTestId(`owner-sit-actions-menu-${sitId}`);
    await expect(actionsMenu).toBeVisible();
    await actionsMenu.getByTestId("owner-sit-cancel").click();

    const dialog = page.getByTestId("cancel-sit-confirm");
    await expect(dialog.getByRole("heading", { name: /Cancel this sit/i })).toBeVisible();
    await expect(actionsMenu).toHaveCount(0);

    const stacking = await page.evaluate(() => {
      const dialogEl = document.querySelector<HTMLElement>("[data-testid='cancel-sit-confirm']");
      const backdrop = dialogEl?.closest<HTMLElement>("div.fixed.inset-0");
      if (!backdrop) {
        return { backdropOnTop: false, topElement: "missing backdrop" };
      }
      const rect = backdrop.getBoundingClientRect();
      const x = Math.min(window.innerWidth - 2, Math.max(1, rect.right - 48));
      const y = Math.min(window.innerHeight - 2, Math.max(1, rect.top + 48));
      const topElement = document.elementFromPoint(x, y);
      return {
        backdropOnTop: Boolean(topElement && backdrop.contains(topElement)),
        topElement:
          topElement instanceof HTMLElement
            ? `${topElement.tagName.toLowerCase()}.${topElement.className}`
            : String(topElement),
      };
    });

    expect(
      stacking.backdropOnTop,
      `Expected the cancel dialog backdrop on top, but got ${stacking.topElement}`,
    ).toBe(true);
  });

  test("owner can cancel an underway sit entirely and cannot unaccept", async ({
    page,
    browser,
  }) => {
    await seedVerifiedOwner(page);
    await seedDevFixture(page, "underway-sit");

    await page.goto("/my-sits");
    const card = page.getByTestId("owner-sit-card-sit-underway-emergency-e2e");
    await expect(card).toBeVisible();
    await expect(page.getByTestId("owner-sits-phase-stayUnderway")).toBeVisible();
    await card.getByTestId("owner-sit-actions-sit-underway-emergency-e2e").click();
    const actionsMenu = page.getByTestId("owner-sit-actions-menu-sit-underway-emergency-e2e");
    await expect(
      actionsMenu.getByTestId("owner-sit-flag-sit-underway-emergency-e2e"),
    ).toBeVisible();
    await expect(actionsMenu.getByTestId("owner-sit-cancel")).toBeVisible();
    await expect(card.getByRole("button", { name: /^Unaccept$/i })).toHaveCount(0);

    await page.goto("/owner/sits/sit-underway-emergency-e2e/applications");
    await expect(page.getByTestId("active-sit-chat")).toBeVisible();
    await expect(page.getByTestId("active-sit-unaccept")).toHaveCount(0);
    await expect(page.getByTestId("active-sit-more-actions")).toBeVisible();

    await page.getByTestId("active-sit-more-actions").click();
    const moreMenu = page.getByTestId("active-sit-more-menu");
    await expect(moreMenu.getByTestId("active-sit-view")).toHaveCount(0);
    await expect(moreMenu.getByTestId("active-sit-flag")).toBeVisible();
    await expect(moreMenu.getByTestId("active-sit-cancel")).toBeVisible();
    await expect(moreMenu.getByTestId("active-sit-end-early-menu")).toHaveCount(0);
    await moreMenu.getByTestId("active-sit-cancel").click();
    const dialog = page.getByTestId("cancel-sit-confirm");
    await expect(dialog.getByRole("heading", { name: /Cancel this sit/i })).toBeVisible();
    await expect(dialog.getByTestId("cancel-sit-reopen")).toBeVisible();
    await expect(moreMenu).toHaveCount(0);
    await dialog.getByRole("button", { name: /Yes, cancel sit/i }).click();

    await expect(page.getByTestId("applications-subtitle")).toContainText(/cancelled/i);
    // Completed sits have no overflow actions (listing is unpublished).
    await expect(page.getByTestId("active-sit-more-actions")).toHaveCount(0);
    await expect(page.getByTestId("active-sit-cancel")).toHaveCount(0);
    await expect(
      page
        .getByTestId("conversation-messages")
        .getByText(/You cancelled this sit with Alex Morgan/i)
        .first(),
    ).toBeVisible();

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
      sitterPage
        .getByTestId("conversation-messages")
        .getByText(/This sit was cancelled by the owner/i),
    ).toBeVisible();

    await sitterPage.goto("/");
    await sitterPage.getByRole("button", { name: /Open notifications/i }).click();
    const menu = sitterPage.getByRole("menu", { name: /Notifications/i });
    await expect(menu.getByText(/cancelled the sit for/i).first()).toBeVisible();

    await sitterContext.close();
  });

  test("owner can cancel and reopen for applicants", async ({ page, browser }) => {
    await seedVerifiedOwner(page);
    await seedDevFixture(page, "underway-sit");

    await page.goto("/owner/sits/sit-underway-emergency-e2e/applications");
    await expect(page.getByTestId("active-sit-more-actions")).toBeVisible();
    await page.getByTestId("active-sit-more-actions").click();
    await page.getByTestId("active-sit-more-menu").getByTestId("active-sit-cancel").click();
    const dialog = page.getByTestId("cancel-sit-confirm");
    await dialog.getByTestId("cancel-sit-reopen").click();
    await expect(dialog.getByRole("button", { name: /Yes, reopen for applicants/i })).toBeVisible();
    await dialog.getByRole("button", { name: /Yes, reopen for applicants/i }).click();

    await expect(page.getByRole("heading", { name: /Applications for/i })).toBeVisible();
    await expect(page.getByTestId("sit-phase-step-acceptingApplicants")).toHaveAttribute(
      "data-current",
      "true",
    );
    await expect(page.getByTestId("active-sit-more-actions")).toBeVisible();
    await expect(page.getByTestId("active-sit-cancel")).toHaveCount(0);
    await page.getByTestId("active-sit-more-actions").click();
    const acceptingMenu = page.getByTestId("active-sit-more-menu");
    await expect(acceptingMenu.getByTestId("active-sit-view")).toBeVisible();
    await expect(acceptingMenu.getByTestId("active-sit-edit")).toBeVisible();
    await expect(acceptingMenu.getByTestId("active-sit-delete")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("application-applicant-list")).toBeVisible();
    await page.getByTestId("application-applicant-list").getByText("Alex Morgan").click();
    await expect(
      page
        .getByTestId("conversation-messages")
        .getByText(/You unaccepted Alex Morgan for this sit/i)
        .first(),
    ).toBeVisible();

    await page.goto("/my-sits");
    const accepting = page.getByTestId("owner-sits-phase-acceptingApplicants");
    await expect(accepting.getByTestId("owner-sit-card-sit-underway-emergency-e2e")).toBeVisible();
    await expect(page.getByTestId("owner-sits-phase-stayUnderway")).toHaveCount(0);

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
      sitterPage
        .getByTestId("conversation-messages")
        .getByText(/You are no longer accepted for this sit/i),
    ).toBeVisible();

    await sitterContext.close();
  });
});
