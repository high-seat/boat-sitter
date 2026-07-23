import { expect, test, type Page } from "@playwright/test";
import { seedVerifiedOwner } from "./helpers/auth";

async function clearConversationPrefs(page: Page) {
  const prefs = await page.request.get("/api/prefs");
  if (!prefs.ok()) return;
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

async function openFirstConversationRow(page: Page) {
  await clearConversationPrefs(page);
  await page.goto("/messages");
  await expect(page.getByRole("heading", { name: /Messages/i })).toBeVisible();
  const list = page.getByTestId("messages-conversation-list");
  await expect(list).toBeVisible();
  const firstRow = list.locator("[data-testid^='conversation-row-']").first();
  await expect(firstRow).toBeVisible();
  const applicationId = (await firstRow.getAttribute("data-testid"))!.replace(
    "conversation-row-",
    "",
  );
  const otherName = (await firstRow.locator("span.font-bold").first().innerText()).trim();
  return { applicationId, list, otherName };
}

test.describe("message conversation row actions", () => {
  test("archives a conversation from the row ellipsis menu", async ({ page }) => {
    await seedVerifiedOwner(page);
    const { applicationId, otherName } = await openFirstConversationRow(page);

    await page.getByTestId(`conversation-row-actions-${applicationId}`).click();
    const menu = page.getByTestId(`conversation-row-actions-menu-${applicationId}`);
    await expect(menu).toBeVisible();
    await page.getByTestId(`conversation-row-archive-${applicationId}`).click();

    const archivedTab = page.getByTestId("messages-tabs").getByRole("tab", { name: /Archived/i });
    await expect(archivedTab).toContainText("1");
    await archivedTab.click();
    await expect(page.getByTestId(`conversation-row-${applicationId}`)).toBeVisible();
    await expect(page.getByRole("link", { name: otherName }).first()).toBeVisible();
  });

  test("deletes a conversation from the row ellipsis menu", async ({ page }) => {
    await seedVerifiedOwner(page);
    const { applicationId } = await openFirstConversationRow(page);

    await page.getByTestId(`conversation-row-actions-${applicationId}`).click();
    await page.getByTestId(`conversation-row-delete-${applicationId}`).click();
    const dialog = page.getByTestId(`conversation-row-delete-dialog-${applicationId}`);
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: /Yes, delete/i }).click();

    await expect(page.getByTestId(`conversation-row-${applicationId}`)).toHaveCount(0);
  });

  test("opens report dialog from the row ellipsis menu", async ({ page }) => {
    await seedVerifiedOwner(page);
    const { applicationId } = await openFirstConversationRow(page);

    await page.getByTestId(`conversation-row-actions-${applicationId}`).click();
    await page.getByTestId(`conversation-row-report-${applicationId}`).click();
    await expect(page.getByTestId(`conversation-row-report-dialog-${applicationId}`)).toBeVisible();
    await expect(page.getByRole("heading", { name: /Report /i })).toBeVisible();
  });
});
