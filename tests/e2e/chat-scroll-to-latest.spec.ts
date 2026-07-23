import { expect, test } from "@playwright/test";
import { seedVerifiedOwner } from "./helpers/auth";

async function isNearBottom(scroller: import("@playwright/test").Locator) {
  return scroller.evaluate((element) => {
    const maxScroll = element.scrollHeight - element.clientHeight;
    return {
      maxScroll,
      scrollTop: element.scrollTop,
      nearBottom: maxScroll <= 0 || element.scrollTop >= maxScroll - 4,
    };
  });
}

test.describe("chat scroll to latest", () => {
  test("opens a conversation scrolled to the most recent message", async ({ page }) => {
    await seedVerifiedOwner(page);
    await page.goto("/owner/sits/solstice/applications");
    await expect(page.getByRole("heading", { name: /Applications for/i })).toBeVisible();

    await page
      .getByRole("button", { name: /Alex Morgan/i })
      .first()
      .click();

    const reply = page.getByTestId("conversation-reply-input");
    const send = page.getByTestId("conversation-send-reply");
    for (let index = 1; index <= 12; index += 1) {
      const text = `Scroll seed message ${index}`;
      await reply.fill(text);
      await send.click();
      await expect(page.getByText(text, { exact: true })).toBeVisible();
      await expect(page.getByRole("button", { name: /Sending/i })).toHaveCount(0);
    }

    await page.getByRole("button", { name: /Theo Janssen/i }).click();
    await expect(page.getByRole("heading", { name: /Theo Janssen/i })).toBeVisible();

    await page
      .getByRole("button", { name: /Alex Morgan/i })
      .first()
      .click();

    const scroller = page.getByTestId("conversation-messages");
    await expect(scroller.getByText("Scroll seed message 12", { exact: true })).toBeVisible();

    await expect.poll(async () => isNearBottom(scroller)).toMatchObject({ nearBottom: true });
  });

  test("auto-scrolls down when a new message appears", async ({ page }) => {
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

    for (let index = 1; index <= 10; index += 1) {
      const text = `Auto-scroll seed ${index}`;
      await reply.fill(text);
      await send.click();
      await expect(scroller.getByText(text, { exact: true })).toBeVisible();
      await expect(page.getByRole("button", { name: /Sending/i })).toHaveCount(0);
    }

    await scroller.evaluate((element) => {
      element.scrollTop = 0;
    });
    await expect.poll(async () => isNearBottom(scroller)).toMatchObject({ nearBottom: false });

    const newest = `Auto-scroll newest ${Date.now()}`;
    await reply.fill(newest);
    await send.click();
    await expect(scroller.getByText(newest, { exact: true })).toBeVisible();
    await expect.poll(async () => isNearBottom(scroller)).toMatchObject({ nearBottom: true });
  });
});
