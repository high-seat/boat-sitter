import { expect, test } from "@playwright/test";
import { seedVerifiedOwner } from "./helpers/auth";

test.describe("notifications menu", () => {
  test("lists notifications and marks them read", async ({ page }) => {
    await seedVerifiedOwner(page);
    await page.goto("/");

    const open = page.getByRole("button", { name: /Open notifications/i });
    await expect(open).toBeVisible();
    await open.click();

    const menu = page.getByRole("menu", { name: /Notifications/i });
    await expect(menu).toBeVisible();
    await expect(menu.getByRole("menuitem").first()).toBeVisible();

    await menu.getByRole("button", { name: /Mark all as read/i }).click();
    await expect(open.locator("span").filter({ hasText: /^\d+$/ })).toHaveCount(0);
  });
});
