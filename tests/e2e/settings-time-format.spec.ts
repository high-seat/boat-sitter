import { expect, test } from "@playwright/test";
import { seedVerifiedOwner } from "./helpers/auth";

test.describe("settings time format", () => {
  test("shows 12/24 hour preference and persists the choice", async ({ page }) => {
    await seedVerifiedOwner(page);
    await page.goto("/settings?tab=preferences");

    await expect(page.getByRole("heading", { name: /^Localization$/i })).toBeVisible();
    const select = page.getByTestId("settings-time-format");
    await expect(select).toBeVisible();
    await expect(select).toHaveValue(/^(12h|24h)$/);

    await select.selectOption("12h");
    await expect(select).toHaveValue("12h");

    await page.reload();
    await expect(page.getByTestId("settings-time-format")).toHaveValue("12h");

    await page.getByTestId("settings-time-format").selectOption("24h");
    await expect(page.getByTestId("settings-time-format")).toHaveValue("24h");
  });
});
