import { expect, test } from "@playwright/test";
import { seedVerifiedOwner } from "./helpers/auth";
import { seedDevFixture } from "./helpers/fixtures";

test.describe("pause new applicants", () => {
  test("owner can pause and resume applicants from applications page", async ({ page }) => {
    await seedVerifiedOwner(page);
    await seedDevFixture(page, "reset-solstice-open");

    await page.goto("/owner/sits/solstice/applications");
    const toggle = page.getByTestId("applications-toggle-applicants");
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveText(/Pause new applicants/i);
    await expect(toggle.locator("svg")).toBeVisible();

    await toggle.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: /Pause new applicants/i })).toBeVisible();
    await dialog.getByRole("button", { name: /Yes, pause applicants/i }).click();

    await expect(toggle).toHaveText(/Resume new applicants/i);
    await expect(toggle.locator("svg")).toBeVisible();

    await toggle.click();
    await expect(toggle).toHaveText(/Pause new applicants/i);
  });

  test("owner can pause applicants from My sits", async ({ page }) => {
    await seedVerifiedOwner(page);
    await seedDevFixture(page, "reset-solstice-open");

    await page.goto("/my-sits");
    const sitCard = page.getByTestId("owner-sit-card-solstice");
    const toggle = sitCard.getByTestId("owner-sit-toggle-applicants");
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveText(/Pause new applicants/i);
    await expect(toggle.locator("svg")).toBeVisible();

    await toggle.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: /Pause new applicants/i })).toBeVisible();
    await dialog.getByRole("button", { name: /Yes, pause applicants/i }).click();

    await expect(toggle).toHaveText(/Resume new applicants/i);
  });
});
