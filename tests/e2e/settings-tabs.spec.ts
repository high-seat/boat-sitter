import { expect, test } from "@playwright/test";
import { seedVerifiedOwner } from "./helpers/auth";

test.describe("settings account tabs", () => {
  test("shows four combined tabs on a wider account page", async ({ page }) => {
    await seedVerifiedOwner(page);
    await page.goto("/settings");

    await expect(page.getByRole("heading", { name: /^Account$/i })).toBeVisible();
    const tabs = page.getByTestId("settings-tabs");
    await expect(tabs).toBeVisible();
    await expect(tabs.getByRole("tab", { name: "Personal details", exact: true })).toBeVisible();
    await expect(tabs.getByRole("tab", { name: "Password & security", exact: true })).toBeVisible();
    await expect(tabs.getByRole("tab", { name: "Preferences", exact: true })).toBeVisible();
    await expect(tabs.getByRole("tab", { name: "Privacy", exact: true })).toBeVisible();
    await expect(page.getByRole("tab", { name: /Email notifications/i })).toHaveCount(0);
    await expect(page.getByRole("tab", { name: /Locali[sz]ation/i })).toHaveCount(0);

    // Green track hugs the tabs instead of stretching full content width.
    const widths = await tabs.evaluate((el) => {
      const parent = el.parentElement;
      return {
        tabs: el.getBoundingClientRect().width,
        parent: parent?.getBoundingClientRect().width ?? 0,
      };
    });
    expect(widths.tabs).toBeLessThan(widths.parent * 0.95);

    await expect(page.getByRole("heading", { name: /^Personal details$/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /^Localization$/i })).toHaveCount(0);

    await tabs.getByRole("tab", { name: "Preferences", exact: true }).click();
    await expect(page).toHaveURL(/tab=preferences/);
    await expect(page.getByRole("heading", { name: /^Localization$/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /^Email notifications$/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /^Sit creation defaults$/i })).toBeVisible();
  });

  test("redirects legacy localization and notifications tabs", async ({ page }) => {
    await seedVerifiedOwner(page);
    await page.goto("/settings?tab=localization");
    await expect(page).toHaveURL(/tab=preferences/);
    await expect(page.getByRole("heading", { name: /^Localization$/i })).toBeVisible();

    await page.goto("/settings?tab=notifications");
    await expect(page).toHaveURL(/tab=preferences/);
    await expect(page.getByRole("heading", { name: /Email notifications/i })).toBeVisible();
  });
});
