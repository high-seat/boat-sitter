import { expect, test } from "@playwright/test";
import { seedOwnerSession, seedVerifiedOwner } from "./helpers/auth";
import { seedDevFixture } from "./helpers/fixtures";

test.describe("messages conversation unread", () => {
  test("shows unread status and count on a conversation row, then clears after opening", async ({
    page,
    browser,
  }) => {
    await seedVerifiedOwner(page);
    await seedDevFixture(page, "reset-solstice-open");
    await seedDevFixture(page, "accept-solstice");

    const clear = await page.request.post("/api/notifications/read-all");
    expect(clear.ok()).toBeTruthy();

    // Keep Samira selected so the Alex / Solstice thread can stay unread in the list.
    await page.goto("/messages?application=application-samira-solstice");
    const list = page.getByTestId("messages-conversation-list");
    await expect(list).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("conversation-row-application-samira-solstice")).toBeVisible();

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
        data: { text: `List unread ping ${Date.now()}` },
      },
    );
    expect(send.ok()).toBeTruthy();
    await sitterContext.close();

    const solsticeRow = page.getByTestId("conversation-row-application-alex-solstice");
    await expect(solsticeRow).toHaveAttribute("data-unread", "true", { timeout: 20_000 });
    await expect(
      page.getByTestId("conversation-unread-status-application-alex-solstice"),
    ).toHaveText(/Unread/i);
    await expect(
      page.getByTestId("conversation-unread-count-application-alex-solstice"),
    ).toHaveText("1");

    await solsticeRow.getByRole("button").first().click();
    await expect(page.getByTestId("conversation-messages")).toBeVisible();
    await expect(solsticeRow).not.toHaveAttribute("data-unread", "true", { timeout: 15_000 });
    await expect(
      page.getByTestId("conversation-unread-count-application-alex-solstice"),
    ).toHaveCount(0);
    await expect(
      page.getByTestId("conversation-unread-status-application-alex-solstice"),
    ).toHaveCount(0);
  });
});

test.describe("message send failure toast", () => {
  test("shows an error toast when sending a message fails", async ({ page }) => {
    await seedVerifiedOwner(page);
    await seedDevFixture(page, "reset-solstice-open");
    await seedDevFixture(page, "accept-solstice");

    await page.route("**/api/applications/*/messages", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ error: "SEND_FAILED" }),
        });
        return;
      }
      await route.continue();
    });

    await page.goto("/messages?application=application-alex-solstice");
    await expect(page.getByTestId("conversation-messages")).toBeVisible();

    const reply = page.getByTestId("conversation-reply-input");
    const unique = `Fail send ${Date.now()}`;
    await reply.fill(unique);
    await page.getByTestId("conversation-send-reply").click();

    const toast = page.getByTestId("toast-error");
    await expect(toast).toBeVisible();
    await expect(toast).toContainText(/could not be sent/i);
    await expect(toast).toContainText(/try again/i);
    await expect(reply).toHaveValue(unique);
  });
});
