import { expect, test } from "@playwright/test";
import { seedOwnerSession, seedVerifiedOwner } from "./helpers/auth";

test.describe("conversation message actions menu", () => {
  test("stays fully visible for a short left-aligned peer message", async ({ page, browser }) => {
    await seedVerifiedOwner(page);

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
      { data: { text: `testing ${Date.now()}` } },
    );
    expect(send.ok()).toBeTruthy();
    const payload = (await send.json()) as { data: { messages: { text: string }[] } };
    const shortText = payload.data.messages.at(-1)?.text ?? "";
    await sitterContext.close();

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/owner/sits/solstice/applications");
    await expect(page.getByRole("heading", { name: /Applications for/i })).toBeVisible();
    await page
      .getByRole("button", { name: /Alex Morgan/i })
      .first()
      .click();
    await expect(page.getByTestId("conversation-messages")).toBeVisible();

    const peerMessage = page
      .getByTestId("conversation-message-peer")
      .filter({ hasText: shortText })
      .last();
    await peerMessage.scrollIntoViewIfNeeded();
    await peerMessage.getByTestId("conversation-message-actions").click();

    const menu = page.getByTestId("conversation-message-actions-menu");
    await expect(menu).toBeVisible();
    await expect(menu.getByTestId("conversation-message-translate")).toBeVisible();
    await expect(menu.getByTestId("conversation-message-report")).toBeVisible();

    const box = await menu.boundingBox();
    expect(box).toBeTruthy();
    if (!box) return;

    const viewport = page.viewportSize();
    expect(viewport).toBeTruthy();
    if (!viewport) return;

    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 0.5);
    expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 0.5);

    // Menu is portaled out of the overflow scroller so it cannot be clipped.
    const insideScroller = await menu.evaluate((element) =>
      Boolean(element.closest('[data-testid="conversation-messages"]')),
    );
    expect(insideScroller).toBe(false);

    await page.getByLabel("Language").selectOption("de");
    if (!(await menu.isVisible())) {
      await peerMessage.getByTestId("conversation-message-actions").click();
    }
    await expect(menu.getByTestId("conversation-message-translate")).toContainText(
      /Mit Google übersetzen|Übersetzung ausblenden|Wird übersetzt/i,
    );
    const deBox = await menu.boundingBox();
    expect(deBox).toBeTruthy();
    if (!deBox) return;
    expect(deBox.x).toBeGreaterThanOrEqual(0);
    expect(deBox.x + deBox.width).toBeLessThanOrEqual(viewport.width + 0.5);
  });
});
