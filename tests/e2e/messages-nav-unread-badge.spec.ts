import { expect, test } from "@playwright/test";
import { seedOwnerSession, seedVerifiedOwner } from "./helpers/auth";
import { seedDevFixture } from "./helpers/fixtures";

test.describe("messages nav unread badge", () => {
  test("shows a count badge for unread chat messages and clears it after opening the thread", async ({
    page,
    browser,
  }) => {
    await seedVerifiedOwner(page);
    await seedDevFixture(page, "reset-solstice-open");
    await seedDevFixture(page, "accept-solstice");

    const clear = await page.request.post("/api/notifications/read-all");
    expect(clear.ok()).toBeTruthy();

    const sitterContext = await browser.newContext();
    const sitterPage = await sitterContext.newPage();
    await seedOwnerSession(sitterPage, {
      name: "Alex Morgan",
      email: "alex.morgan@boatstead.mock",
      image: "https://i.pravatar.cc/160?img=11",
      phoneNumber: "7700900123",
      verified: true,
    });

    const send = await sitterPage.request.post(
      "/api/applications/application-alex-solstice/messages",
      {
        data: { text: `Unread badge ping ${Date.now()}` },
      },
    );
    expect(send.ok()).toBeTruthy();
    await sitterContext.close();

    await page.goto("/");
    // Desktop + mobile nav both mount the same controls.
    const messagesLink = page.getByTestId("messages-nav-link").first();
    await expect(messagesLink).toHaveAttribute("aria-label", /Messages, 1 unread/i, {
      timeout: 15_000,
    });
    await expect(page.getByTestId("messages-unread-count").first()).toHaveText("1");

    // Chat messages stay off the notifications bell; the messages badge owns unread.
    await page.getByTestId("notifications-open").first().click();
    const menu = page.getByTestId("notifications-menu");
    await expect(menu).toBeVisible();
    await expect(menu.getByRole("menuitem", { name: /sent you a new message/i })).toHaveCount(0);
    await page.keyboard.press("Escape");

    await page.goto("/messages?application=application-alex-solstice");
    await expect(page.getByTestId("conversation-messages")).toBeVisible();
    await expect(page.getByTestId("messages-nav-link").first()).toHaveAttribute(
      "aria-label",
      /^Messages$/i,
      {
        timeout: 15_000,
      },
    );
    await expect(page.getByTestId("messages-unread-count")).toHaveCount(0);
  });
});
