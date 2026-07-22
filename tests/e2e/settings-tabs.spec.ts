import { expect, test } from "@playwright/test";
import { seedVerifiedOwner } from "./helpers/auth";

test.describe("settings account tabs", () => {
  test("shows four combined tabs on a wider account page", async ({ page }) => {
    await seedVerifiedOwner(page);
    await page.goto("/settings");

    await expect(page.getByRole("heading", { name: /^Account$/i })).toBeVisible();
    await expect(page.getByRole("button", { name: "Personal details", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Password & security", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Preferences", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Privacy", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: /Email notifications/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Locali[sz]ation/i })).toHaveCount(0);

    await expect(page.getByRole("heading", { name: /^Personal details$/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /^Localization$/i })).toBeVisible();

    await page.getByRole("button", { name: "Preferences", exact: true }).click();
    await expect(page).toHaveURL(/tab=preferences/);
    await expect(page.getByRole("heading", { name: /^Email notifications$/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /^Sit creation defaults$/i })).toBeVisible();
  });

  test("redirects legacy localization and notifications tabs", async ({ page }) => {
    await seedVerifiedOwner(page);
    await page.goto("/settings?tab=localization");
    await expect(page).toHaveURL(/\/settings\/?$/);
    await expect(page.getByRole("heading", { name: /Personal details/i })).toBeVisible();

    await page.goto("/settings?tab=notifications");
    await expect(page).toHaveURL(/tab=preferences/);
    await expect(page.getByRole("heading", { name: /Email notifications/i })).toBeVisible();
  });
});
