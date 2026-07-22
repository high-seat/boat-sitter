import { expect, test } from "@playwright/test";
import { seedVerifiedOwner } from "./helpers/auth";

test.describe("message archive", () => {
  test("archives a conversation and shows it under Archived", async ({ page }) => {
    await seedVerifiedOwner(page);
    await page.goto("/messages");
    await expect(page.getByRole("heading", { name: /Messages/i })).toBeVisible();

    const inboxTab = page.getByRole("button", { name: /^Inbox/i });
    const archivedTab = page.getByRole("button", { name: /^Archived/i });
    await expect(inboxTab).toBeVisible();
    await expect(archivedTab).toBeVisible();

    const firstConversation = page.locator("aside button").first();
    await expect(firstConversation).toBeVisible();
    const otherName = (await firstConversation.locator("span.font-bold").first().innerText()).trim();
    await firstConversation.click();

    await page.getByRole("button", { name: /Archive conversation/i }).click();
    await expect(archivedTab).toContainText("1");
    await archivedTab.click();
    await expect(page.getByRole("link", { name: otherName }).first()).toBeVisible();

    await page.getByRole("button", { name: /Move to inbox/i }).click();
    await expect(inboxTab).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("link", { name: otherName }).first()).toBeVisible();
  });
});
