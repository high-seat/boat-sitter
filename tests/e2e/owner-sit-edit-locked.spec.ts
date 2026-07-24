import { expect, test } from "@playwright/test";
import { seedVerifiedOwner } from "./helpers/auth";
import { seedDevFixture } from "./helpers/fixtures";

test.describe("owner sit edit locked by phase", () => {
  test("hides Edit for underway and completed sits", async ({ page }) => {
    await seedVerifiedOwner(page);
    await seedDevFixture(page, "underway-sit");
    await seedDevFixture(page, "completed-sit");

    await page.goto("/my-sits");

    const underwayId = "sit-underway-emergency-e2e";
    const completedId = "sit-completed-archive-e2e";

    await page.getByTestId(`owner-sit-actions-${underwayId}`).click();
    const underwayMenu = page.getByTestId(`owner-sit-actions-menu-${underwayId}`);
    await expect(underwayMenu).toBeVisible();
    await expect(underwayMenu.getByTestId(`owner-sit-edit-${underwayId}`)).toHaveCount(0);
    await page.keyboard.press("Escape");

    await page.getByTestId("owner-sits-show-older-completed").getByRole("checkbox").check();

    // Completed sits have an empty overflow menu (no edit/archive actions).
    await expect(page.getByTestId(`owner-sit-actions-${completedId}`)).toHaveCount(0);
  });

  test("redirects away from the editor for underway and completed sits", async ({ page }) => {
    await seedVerifiedOwner(page);
    await seedDevFixture(page, "underway-sit");
    await seedDevFixture(page, "completed-sit");

    await page.goto("/owner/sits/sit-underway-emergency-e2e/edit");
    await expect(page).toHaveURL(/\/my-sits$/);
    await expect(page.getByRole("heading", { name: /My sits/i })).toBeVisible();

    await page.goto("/owner/sits/sit-completed-archive-e2e/edit");
    await expect(page).toHaveURL(/\/my-sits$/);
    await expect(page.getByRole("heading", { name: /My sits/i })).toBeVisible();
  });
});
