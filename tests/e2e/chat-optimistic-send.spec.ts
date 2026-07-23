import { expect, test } from "@playwright/test";
import { seedVerifiedOwner } from "./helpers/auth";

test.describe("optimistic chat send", () => {
  test("shows the message with a spinner before the server confirms", async ({ page }) => {
    await seedVerifiedOwner(page);
    await page.goto("/owner/sits/solstice/applications");
    await expect(page.getByRole("heading", { name: /Applications for/i })).toBeVisible();

    await page
      .getByRole("button", { name: /Alex Morgan/i })
      .first()
      .click();

    const uniqueText = `Optimistic ping ${Date.now()}`;
    const reply = page.getByTestId("conversation-reply-input");
    await reply.fill(uniqueText);

    await page.getByTestId("conversation-send-reply").click();

    const pendingBubble = page.getByText(uniqueText, { exact: true });
    await expect(pendingBubble).toBeVisible();
    await expect(page.getByLabel(/Sending/i)).toBeVisible();

    await expect(page.getByLabel(/Sending/i)).toHaveCount(0, { timeout: 10_000 });
    await expect(page.getByText(uniqueText, { exact: true })).toBeVisible();
    await expect(page.getByTestId("conversation-send-reply")).toBeVisible();
    await expect(page.getByRole("button", { name: /Sending/i })).toHaveCount(0);
  });
});
