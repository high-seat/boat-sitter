import { expect, test } from "@playwright/test";
import { seedVerifiedOwner } from "./helpers/auth";

test.describe("share phone in chat", () => {
  test("owner can share profile phone into the conversation", async ({ page }) => {
    await seedVerifiedOwner(page);
    await page.goto("/owner/sits/solstice/applications");
    await expect(page.getByRole("heading", { name: /Applications for/i })).toBeVisible();

    await page
      .getByRole("button", { name: /Alex Morgan/i })
      .first()
      .click();
    await page.getByRole("button", { name: /Share phone number/i }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: /Share your phone number/i })).toBeVisible();
    await expect(dialog.getByText(/\+30 6912345678/)).toBeVisible();
    await dialog.getByRole("button", { name: /Share number/i }).click();

    await expect(page.getByText(/Phone number shared/i).first()).toBeVisible();
    await expect(page.getByText(/Maya & Finn shared their phone number/i).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /\+30 6912345678/ })).toBeVisible();

    const phoneCard = page
      .getByText(/Phone number shared/i)
      .first()
      .locator("xpath=ancestor::div[contains(@class,'rounded-2xl')][1]");
    const phoneRow = phoneCard.locator("xpath=..");
    await expect(phoneRow).toHaveClass(/justify-end/);
    await expect(phoneRow).not.toHaveClass(/justify-center/);
  });
});
