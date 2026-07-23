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

    await expect(page.getByText(/Enter to send/i)).toBeVisible();
    await expect(page.getByText(/for a new line/i)).toBeVisible();

    const reply = page.getByPlaceholder(/Write a reply/i);
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
