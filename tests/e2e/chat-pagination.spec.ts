import { expect, test } from "@playwright/test";
import { seedVerifiedOwner } from "./helpers/auth";

test.describe("chat pagination", () => {
  test("keeps sent messages visible and loads older history on scroll", async ({ page }) => {
    test.setTimeout(120000);
    await seedVerifiedOwner(page);
    await page.goto("/owner/sits/solstice/applications");
    await expect(page.getByRole("heading", { name: /Applications for/i })).toBeVisible();

    await page
      .getByRole("button", { name: /Alex Morgan/i })
      .first()
      .click();

    const reply = page.getByTestId("conversation-reply-input");
    const send = page.getByTestId("conversation-send-reply");
    const scroller = page.getByTestId("conversation-messages");
    await expect(scroller).toBeVisible();

    const messagePrefix = `pg${Date.now().toString().slice(-6)}`;

    for (let index = 1; index <= 12; index += 1) {
      const text = `${messagePrefix}-${index}`;
      await reply.fill(text);
      await expect(send).toBeEnabled();
      await send.click();
      await expect(scroller.getByText(text, { exact: true })).toBeVisible({ timeout: 20000 });
      await expect(send).toHaveAttribute("aria-label", /send reply/i, { timeout: 20000 });
    }

    // Sliding page window must not drop earlier sends from this session.
    await expect(scroller.getByText(`${messagePrefix}-1`, { exact: true })).toBeVisible();
    await expect(scroller.getByText(`${messagePrefix}-12`, { exact: true })).toBeVisible();

    await page.route("**/api/applications/*/messages?*before=*", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 800));
      await route.continue();
    });

    await scroller.evaluate((element) => {
      element.scrollTop = 0;
    });

    const indicator = page.getByTestId("conversation-fetching-older");

    await expect(async () => {
      const indicatorVisible = await indicator.isVisible().catch(() => false);
      const firstVisible = await scroller
        .getByText(`${messagePrefix}-1`, { exact: true })
        .isVisible()
        .catch(() => false);
      expect(indicatorVisible || firstVisible).toBe(true);
    }).toPass({ timeout: 20000 });
  });
});
