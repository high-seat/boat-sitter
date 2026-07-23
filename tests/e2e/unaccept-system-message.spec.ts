import { expect, test } from "@playwright/test";
import { seedOwnerSession, seedVerifiedOwner } from "./helpers/auth";
import { seedDevFixture } from "./helpers/fixtures";

test.describe("unaccept system message and notification", () => {
  test("posts owner-facing chat copy and notifies the applicant", async ({ page, browser }) => {
    await seedVerifiedOwner(page);
    await seedDevFixture(page, "reset-solstice-open");
    await seedDevFixture(page, "accept-solstice");

    await page.goto("/owner/sits/solstice/applications");
    await expect(page.getByRole("heading", { name: /Applications for/i })).toBeVisible();
    await page
      .getByRole("button", { name: /Alex Morgan/i })
      .first()
      .click();
    await expect(page.getByRole("heading", { name: "Alex Morgan" })).toBeVisible();

    await page.getByRole("button", { name: /^Unaccept$/i }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: /Unaccept Alex/i })).toBeVisible();
    await dialog.getByRole("button", { name: /Yes, unaccept/i }).click();

    await expect(page.getByText(/You unaccepted Alex Morgan for this sit/i)).toBeVisible();
    await expect(page.getByText(/You are no longer accepted for this sit/i)).toHaveCount(0);

    const sitterContext = await browser.newContext();
    const sitterPage = await sitterContext.newPage();
    await seedOwnerSession(sitterPage, {
      name: "Alex Morgan",
      email: "alex.morgan@boatstead.mock",
      image: "https://i.pravatar.cc/160?img=11",
      phoneNumber: "7700900123",
      verified: true,
    });

    await sitterPage.goto("/messages?application=application-alex-solstice");
    const conversation = sitterPage.getByTestId("conversation-messages");
    await expect(conversation.getByText(/You are no longer accepted for this sit/i)).toBeVisible();
    await expect(conversation.getByText(/You unaccepted Alex Morgan for this sit/i)).toHaveCount(0);

    await sitterPage.goto("/");
    await sitterPage.getByRole("button", { name: /Open notifications/i }).click();
    const menu = sitterPage.getByRole("menu", { name: /Notifications/i });
    await expect(menu).toBeVisible();
    await expect(
      menu.getByText(/Maya & Finn is no longer confirming you for Solstice/i).first(),
    ).toBeVisible();

    await sitterContext.close();
  });
});
