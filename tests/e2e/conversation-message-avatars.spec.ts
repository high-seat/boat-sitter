import { expect, test } from "@playwright/test";
import { seedVerifiedOwner } from "./helpers/auth";

test.describe("conversation message avatars", () => {
  test("shows peer avatars and only one own avatar at the end of a stack", async ({ page }) => {
    await seedVerifiedOwner(page);
    await page.goto("/owner/sits/solstice/applications");
    await expect(page.getByRole("heading", { name: /Applications for/i })).toBeVisible();

    await page
      .getByRole("button", { name: /Alex Morgan/i })
      .first()
      .click();

    const conversation = page.getByTestId("conversation-messages");
    await expect(conversation).toBeVisible();

    await expect(
      conversation.getByTestId("conversation-message-avatar-peer").first(),
    ).toBeVisible();
    await expect(
      conversation.getByTestId("conversation-message-avatar-peer").first(),
    ).toHaveAttribute("src", /.+/);

    const reply = page.getByTestId("conversation-reply-input");
    const first = `Stack avatar one ${Date.now()}`;
    const second = `Stack avatar two ${Date.now()}`;

    await reply.fill(first);
    await page.getByTestId("conversation-send-reply").click();
    await expect(
      conversation.getByTestId("conversation-message-own").filter({ hasText: first }),
    ).toBeVisible();

    await reply.fill(second);
    await page.getByTestId("conversation-send-reply").click();
    await expect(
      conversation.getByTestId("conversation-message-own").filter({ hasText: second }),
    ).toBeVisible();

    const firstOwn = conversation
      .getByTestId("conversation-message-own")
      .filter({ hasText: first });
    const secondOwn = conversation
      .getByTestId("conversation-message-own")
      .filter({ hasText: second });

    await expect(
      firstOwn.locator("..").getByTestId("conversation-message-avatar-own-spacer"),
    ).toBeVisible();
    await expect(firstOwn.locator("..").getByTestId("conversation-message-avatar-own")).toHaveCount(
      0,
    );

    await expect(
      secondOwn.locator("..").getByTestId("conversation-message-avatar-own"),
    ).toBeVisible();
    await expect(
      secondOwn.locator("..").getByTestId("conversation-message-avatar-own-spacer"),
    ).toHaveCount(0);

    await expect(firstOwn.getByTestId("conversation-message-tail-own")).toHaveCount(0);
    await expect(secondOwn.getByTestId("conversation-message-tail-own")).toBeVisible();
    await expect(
      conversation
        .getByTestId("conversation-message-peer")
        .first()
        .getByTestId("conversation-message-tail-peer"),
    ).toBeVisible();
  });
});
