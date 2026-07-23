import { expect, test } from "@playwright/test";
import { seedVerifiedOwner } from "./helpers/auth";

test.describe("sit phase labels", () => {
  test("shows Applicant accepted for the chosen-sitter phase", async ({ page }) => {
    await seedVerifiedOwner(page);
    await page.goto("/owner/sits/solstice/applications");
    await expect(page.getByText(/Applicant accepted/i).first()).toBeVisible();
    await expect(page.getByText(/Waiting for confirmation/i)).toHaveCount(0);
    await expect(page.getByText(/^Stay underway$/i)).toHaveCount(0);
  });
});
