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
    const messagesLink = page.getByRole("link", { name: /Messages, 1 unread/i }).first();
    await expect(messagesLink).toBeVisible({ timeout: 15_000 });
    await expect(messagesLink.locator("span").filter({ hasText: /^1$/ })).toBeVisible();

    await page.goto("/messages?application=application-alex-solstice");
    await expect(page.getByTestId("conversation-messages")).toBeVisible();
    await expect(page.getByRole("link", { name: /^Messages$/i }).first()).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole("link", { name: /Messages, \d+ unread/i })).toHaveCount(0);
  });
});
