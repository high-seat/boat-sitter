import { expect, test } from "@playwright/test";
import { seedVerifiedOwner } from "./helpers/auth";

test.describe("conversation own message label", () => {
  test("shows You instead of your display name on your messages", async ({ page }) => {
    await seedVerifiedOwner(page);
    await page.goto("/owner/sits/solstice/applications");
    await expect(page.getByRole("heading", { name: /Applications for/i })).toBeVisible();

    await page
      .getByRole("button", { name: /Alex Morgan/i })
      .first()
      .click();
    const reply = page.getByTestId("conversation-reply-input");
    const text = `You-label check ${Date.now()}`;
    await reply.fill(text);
    await page.getByTestId("conversation-send-reply").click();

    const own = page.getByTestId("conversation-message-own").filter({ hasText: text });
    await expect(own).toBeVisible();
    await expect(own.getByText(/^You$/)).toBeVisible();
    await expect(own.getByText(/Maya & Finn/)).toHaveCount(0);

    await page.getByLabel("Language").selectOption("de");
    await expect(own.getByText(/^Du$/)).toBeVisible();
  });
});
