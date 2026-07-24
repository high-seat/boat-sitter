import { expect, test } from "@playwright/test";
import { seedVerifiedOwner } from "./helpers/auth";

test.describe("chat reply keyboard", () => {
  test("Enter sends and modifier+Enter inserts a new line", async ({ page }) => {
    await seedVerifiedOwner(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/owner/sits/solstice/applications");
    await expect(page.getByRole("heading", { name: /Applications for/i })).toBeVisible();
    await page
      .getByRole("button", { name: /Alex Morgan/i })
      .first()
      .click();

    const composer = page.getByTestId("conversation-composer");
    const replyHint = page.getByTestId("conversation-reply-hint");
    await expect(replyHint).toBeVisible();
    await expect(replyHint.locator("kbd").first()).toBeVisible();
    await expect(replyHint).toContainText("+");
    await expect(composer.getByTestId("conversation-composer-avatar")).toBeVisible();
    await expect(page.getByTestId("conversation-send-reply")).toBeVisible();

    const reply = page.getByTestId("conversation-reply-input");
    await reply.click();
    await reply.pressSequentially("Line one");
    await reply.press("Control+Enter");
    await reply.pressSequentially("Line two");
    await expect(reply).toHaveValue("Line one\nLine two");

    const unique = `Enter send ${Date.now()}`;
    await reply.fill(unique);
    await reply.press("Enter");
    await expect(page.getByText(unique, { exact: true })).toBeVisible();
    await expect(reply).toHaveValue("");
  });

  test("hides keyboard reply hint on mobile", async ({ page }) => {
    await seedVerifiedOwner(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/owner/sits/solstice/applications");
    await expect(page.getByRole("heading", { name: /Applications for/i })).toBeVisible();
    await page
      .getByRole("button", { name: /Alex Morgan/i })
      .first()
      .click();

    await expect(page.getByTestId("conversation-composer")).toBeVisible();
    await expect(page.getByTestId("conversation-reply-hint")).toBeHidden();
  });
});
