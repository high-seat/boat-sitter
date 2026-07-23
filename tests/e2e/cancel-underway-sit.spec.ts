import { expect, test } from "@playwright/test";
import { seedOwnerSession, seedVerifiedOwner } from "./helpers/auth";
import { seedDevFixture } from "./helpers/fixtures";

test.describe("cancel underway sit", () => {
  test("owner can cancel an underway sit entirely and cannot unaccept", async ({
    page,
    browser,
  }) => {
    await seedVerifiedOwner(page);
    await seedDevFixture(page, "underway-sit");

    await page.goto("/my-sits");
    const card = page
      .locator("article")
      .filter({ has: page.locator('a[href*="/boats/sit-underway-emergency-e2e"]') })
      .first();
    await expect(card.getByText(/^Sit underway$/i)).toBeVisible();
    await expect(card.getByTestId("owner-sit-cancel")).toBeVisible();
    await expect(card.getByRole("button", { name: /^Unaccept$/i })).toHaveCount(0);

    await page.goto("/owner/sits/sit-underway-emergency-e2e/applications");
    await expect(page.getByTestId("active-sit-chat")).toBeVisible();
    await expect(page.getByTestId("active-sit-unaccept")).toHaveCount(0);
    await expect(page.getByTestId("active-sit-cancel")).toBeVisible();

    await page.getByTestId("active-sit-cancel").click();
    const dialog = page.getByTestId("cancel-sit-confirm");
    await expect(dialog.getByRole("heading", { name: /Cancel this sit/i })).toBeVisible();
    await expect(dialog.getByTestId("cancel-sit-reopen")).toBeVisible();
    await dialog.getByRole("button", { name: /Yes, cancel sit/i }).click();

    await expect(page.getByText(/^Sit cancelled$/i).first()).toBeVisible();
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
    await page.getByTestId("active-sit-cancel").click();
    const dialog = page.getByTestId("cancel-sit-confirm");
    await dialog.getByTestId("cancel-sit-reopen").click();
    await expect(dialog.getByRole("button", { name: /Yes, reopen for applicants/i })).toBeVisible();
    await dialog.getByRole("button", { name: /Yes, reopen for applicants/i }).click();

    await expect(page.getByRole("heading", { name: /Applications for/i })).toBeVisible();
    await expect(page.getByText(/^Accepting applicants$/i).first()).toBeVisible();
    await expect(page.getByTestId("application-applicant-list")).toBeVisible();
    await page.getByTestId("application-applicant-list").getByText("Alex Morgan").click();
    await expect(
      page
        .getByTestId("conversation-messages")
        .getByText(/You unaccepted Alex Morgan for this sit/i)
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
        .getByText(/You are no longer accepted for this sit/i),
    ).toBeVisible();

    await sitterContext.close();
  });
});
