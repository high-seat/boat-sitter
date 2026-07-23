import { expect, test } from "@playwright/test";
import { seedVerifiedOwner } from "./helpers/auth";

test.describe("chat reply keyboard", () => {
  test("Enter sends and modifier+Enter inserts a new line", async ({ page }) => {
    await seedVerifiedOwner(page);
    await page.goto("/owner/sits/solstice/applications");
    await expect(page.getByRole("heading", { name: /Applications for/i })).toBeVisible();
    await page
      .getByRole("button", { name: /Alex Morgan/i })
      .first()
      .click();

    const composer = page.getByTestId("conversation-composer");
    await expect(composer.getByText(/Enter to send/i)).toBeVisible();
    await expect(composer.getByText(/for a new line/i)).toBeVisible();
    await expect(page.getByTestId("conversation-composer-avatar")).toBeVisible();
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
});
