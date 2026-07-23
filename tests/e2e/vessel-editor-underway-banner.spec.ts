import { expect, test } from "@playwright/test";
import { seedVerifiedOwner } from "./helpers/auth";
import { seedDevFixture } from "./helpers/fixtures";

test.describe("vessel editor underway banner", () => {
  test("shows a banner when the boat has a sit underway", async ({ page }) => {
    await seedVerifiedOwner(page);
    await seedDevFixture(page, "underway-sit");

    await page.goto("/owner/boats/solstice-boat/edit");
    await expect(page.getByRole("heading", { name: /Edit Solstice/i })).toBeVisible();

    const banner = page.getByRole("status").filter({ hasText: /sit is underway/i });
    await expect(banner).toBeVisible();
    await expect(banner.getByText(/Tell your sitter about any major changes/i)).toBeVisible();

    const nameField = page.locator("label").filter({ hasText: /^Boat name$/ });
    await expect(nameField).toBeVisible();
    await expect(nameField).toHaveClass(/sm:col-span-2/);
    const bannerBox = await banner.boundingBox();
    const nameBox = await nameField.boundingBox();
    expect(bannerBox?.y ?? Number.POSITIVE_INFINITY).toBeLessThan(nameBox?.y ?? 0);
  });

  test("hides the banner when no sits are underway", async ({ page }) => {
    await seedVerifiedOwner(page);
    await seedDevFixture(page, "clear-underway-sit");

    await page.goto("/owner/boats/solstice-boat/edit");
    await expect(page.getByRole("heading", { name: /Edit Solstice/i })).toBeVisible();
    await expect(page.getByText(/Tell your sitter about any major changes/i)).toHaveCount(0);
  });
});
