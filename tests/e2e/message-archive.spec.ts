import { expect, test } from "@playwright/test";
import { seedVerifiedOwner } from "./helpers/auth";

test.describe("message archive", () => {
  test("archives a conversation and shows it under Archived", async ({ page }) => {
    await seedVerifiedOwner(page);
    const prefs = await page.request.get("/api/prefs");
    if (prefs.ok()) {
      const body = (await prefs.json()) as {
        data: { archivedConversations: string[]; deletedConversations?: string[] };
      };
      for (const id of body.data.archivedConversations ?? []) {
        await page.request.delete(`/api/prefs/archived-conversations/${encodeURIComponent(id)}`);
      }
      for (const id of body.data.deletedConversations ?? []) {
        await page.request.delete(`/api/prefs/deleted-conversations/${encodeURIComponent(id)}`);
      }
    }
    await page.goto("/messages");
    await expect(page.getByRole("heading", { name: /Messages/i })).toBeVisible();

    const inboxTab = page.getByTestId("messages-tabs").getByRole("tab", { name: /Inbox/i });
    const archivedTab = page.getByTestId("messages-tabs").getByRole("tab", { name: /Archived/i });
    await expect(inboxTab).toBeVisible();
    await expect(archivedTab).toBeVisible();

    const list = page.getByTestId("messages-conversation-list");
    const firstConversation = list.locator("[data-testid^='conversation-row-']").first();
    await expect(firstConversation).toBeVisible();
    const otherName = (
      await firstConversation.locator("span.font-bold").first().innerText()
    ).trim();
    await firstConversation.getByRole("button").first().click();

    await page.getByRole("button", { name: /Archive conversation/i }).click();
    await expect(archivedTab).toContainText("1");
    await archivedTab.click();
    await expect(page.getByRole("link", { name: otherName }).first()).toBeVisible();

    await page.getByRole("button", { name: /Move to inbox/i }).click();
    await expect(inboxTab).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("link", { name: otherName }).first()).toBeVisible();
  });
});
