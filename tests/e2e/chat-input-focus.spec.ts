import { expect, test } from "@playwright/test";
import { seedVerifiedOwner } from "./helpers/auth";

test.describe("chat input focus", () => {
  test("focuses the reply field when a conversation opens", async ({ page }) => {
    await seedVerifiedOwner(page);
    await page.goto("/owner/sits/solstice/applications");
    await expect(page.getByRole("heading", { name: /Applications for/i })).toBeVisible();

    const reply = page.getByTestId("conversation-reply-input");
    await expect(reply).toBeFocused();
    await expect(page.getByTestId("conversation-composer-avatar")).toBeVisible();
    await expect(page.getByTestId("conversation-send-reply")).toBeVisible();

    const applicantButtons = page.locator("aside button");
    const count = await applicantButtons.count();
    expect(count).toBeGreaterThan(1);

    await applicantButtons.nth(1).click();
    await expect(reply).toBeFocused();

    await applicantButtons.nth(0).click();
    await expect(reply).toBeFocused();
  });

  test("focuses the reply field when opening messages from the inbox", async ({ page }) => {
    await seedVerifiedOwner(page);
    await page.goto("/messages");
    await expect(page.getByRole("heading", { name: /Messages/i })).toBeVisible();

    await page
      .getByRole("button", { name: /Alex Morgan|Solstice/i })
      .first()
      .click();

    await expect(page.getByTestId("conversation-reply-input")).toBeFocused();
  });
});
