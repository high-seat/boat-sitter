import { expect, test } from "@playwright/test";
import { seedVerifiedOwner } from "./helpers/auth";

test.describe("declined system message perspective", () => {
  test("shows owner-facing copy in the application conversation", async ({ page }) => {
    await seedVerifiedOwner(page);
    await page.goto("/owner/sits/solstice/applications");
    await expect(page.getByRole("heading", { name: /Applications for/i })).toBeVisible();

    await page.getByRole("button", { name: /Theo Janssen/i }).click();
    await expect(page.getByRole("heading", { name: "Theo Janssen" })).toBeVisible();
    await expect(
      page.getByText(/You are no longer considering Theo Janssen for this sit/i),
    ).toBeVisible();
    await expect(page.getByText(/You are no longer being considered for this sit/i)).toHaveCount(0);
  });
});
