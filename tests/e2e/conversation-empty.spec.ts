import { expect, test } from "@playwright/test";
import { seedVerifiedOwner } from "./helpers/auth";

function clearApplicationMessages(body: unknown) {
  if (!body || typeof body !== "object") return body;
  const record = body as Record<string, unknown>;
  for (const key of ["data", "accepted", "items"] as const) {
    const list = record[key];
    if (!Array.isArray(list)) continue;
    for (const app of list) {
      if (app && typeof app === "object") {
        const application = app as { messages?: unknown[]; initialMessage?: string };
        application.messages = [];
        application.initialMessage = "";
      }
    }
  }
  return body;
}

test.describe("conversation empty state", () => {
  test("shows no messages yet when the thread is empty", async ({ page }) => {
    await seedVerifiedOwner(page);

    await page.goto("/owner/sits/solstice/applications");
    await expect(page.getByRole("heading", { name: /Applications for/i })).toBeVisible();
    await expect(page.getByTestId("conversation-messages")).toBeVisible();

    await page.route("**/api/applications?*", async (route) => {
      if (route.request().method() !== "GET") {
        await route.continue();
        return;
      }
      const response = await route.fetch();
      const body = clearApplicationMessages(await response.json());
      await route.fulfill({
        status: response.status(),
        contentType: "application/json",
        body: JSON.stringify(body),
      });
    });

    await page.reload();
    await expect(page.getByRole("heading", { name: /Applications for/i })).toBeVisible();
    await expect(page.getByTestId("conversation-empty")).toBeVisible();
    await expect(page.getByTestId("conversation-empty")).toHaveText("No messages yet");
    await expect(page.getByTestId("conversation-message-own")).toHaveCount(0);
    await expect(page.getByTestId("conversation-message-peer")).toHaveCount(0);

    await page.getByLabel("Language").selectOption("de");
    await expect(page.getByTestId("conversation-empty")).toHaveText("Noch keine Nachrichten");
  });
});
