import { expect, test } from "@playwright/test";
import { seedVerifiedOwner } from "./helpers/auth";

test.describe("vessel editor live preview", () => {
  test("shows a live boat preview that updates with the name", async ({ page }) => {
    await seedVerifiedOwner(page);
    await page.goto("/owner/boats/new");
    await expect(page.getByRole("heading", { name: /Add a boat/i })).toBeVisible();

    const preview = page.getByRole("complementary", { name: /Live preview/i });
    await expect(preview).toBeVisible();
    await expect(preview.getByText(/Untitled boat|How it will look/i).first()).toBeVisible();

    await page.getByPlaceholder(/for example Solstice/i).fill("Preview Wind");
    await expect(preview.getByText("Preview Wind")).toBeVisible();

    await page.getByPlaceholder("Start typing a city").fill("Antibes, France");
    await expect(preview.getByText(/Antibes/i)).toBeVisible();
  });
});
