import { expect, test } from "@playwright/test";
import { seedVerifiedOwner } from "./helpers/auth";

test.describe("return to accepted applicant", () => {
  test("shows back control after viewing a declined applicant", async ({ page }) => {
    await seedVerifiedOwner(page);
    await page.goto("/owner/sits/solstice/applications");
    await expect(page.getByRole("heading", { name: /Applications for/i })).toBeVisible();

    // Accepted sitter is highlighted in the banner; detail starts on that applicant.
    await expect(page.getByText("Viewing details")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Alex Morgan" })).toBeVisible();

    await page.getByRole("button", { name: /Theo Janssen/i }).click();
    await expect(page.getByRole("heading", { name: "Theo Janssen" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Back to Alex Morgan/i })).toBeVisible();

    await page.getByRole("button", { name: /Back to Alex Morgan/i }).click();
    await expect(page.getByRole("heading", { name: "Alex Morgan" })).toBeVisible();
    await expect(page.getByText("Viewing details")).toBeVisible();
    await expect(page.getByRole("button", { name: /Back to Alex Morgan/i })).toHaveCount(0);
  });

  test("banner restores accepted applicant details", async ({ page }) => {
    await seedVerifiedOwner(page);
    await page.goto("/owner/sits/solstice/applications");

    await page.getByRole("button", { name: /Theo Janssen/i }).click();
    await expect(page.getByRole("heading", { name: "Theo Janssen" })).toBeVisible();

    await page.getByRole("button", { name: /View accepted applicant/i }).click();
    await expect(page.getByRole("heading", { name: "Alex Morgan" })).toBeVisible();
    await expect(page.getByText("Viewing details")).toBeVisible();
  });

  test("hides boat access details from the application conversation", async ({ page }) => {
    await seedVerifiedOwner(page);
    await page.goto("/owner/sits/solstice/applications");
    await expect(page.getByRole("heading", { name: "Alex Morgan" })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Conversation/i })).toBeVisible();
    await expect(page.getByRole("region", { name: /Boat access details/i })).toHaveCount(0);
    await expect(page.getByText(/Solstice-Guest/i)).toHaveCount(0);
  });
});
