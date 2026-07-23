import { expect, test } from "@playwright/test";
import { seedVerifiedOwner } from "./helpers/auth";
import { seedDevFixture } from "./helpers/fixtures";

test.describe("owner sit delete and archive", () => {
  test("warns when deleting a sit with an accepted applicant", async ({ page }) => {
    await seedVerifiedOwner(page);
    await seedDevFixture(page, "accept-solstice");
    await page.goto("/my-sits");
    await expect(page.getByRole("heading", { name: /My sits/i })).toBeVisible();

    const sitCard = page
      .locator("article")
      .filter({ hasText: /Solstice/i })
      .filter({ has: page.getByRole("button", { name: /Delete .* sit/i }) })
      .filter({ hasText: /Applicant accepted|Accepted/i })
      .first();
    await expect(sitCard).toBeVisible();
    await sitCard.getByRole("button", { name: /Delete .* sit/i }).click();

    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByText(/Someone has already been accepted.*inform them/i)).toBeVisible();
    await page.getByRole("button", { name: /Cancel/i }).click();
  });

  test("archives a completed sit into the Archived section", async ({ page }) => {
    await seedVerifiedOwner(page);
    await seedDevFixture(page, "completed-sit");

    await page.goto("/my-sits");
    await expect(page.getByRole("heading", { name: /Sit completed/i })).toBeVisible();

    const completedCard = page
      .locator("section")
      .filter({ has: page.getByRole("heading", { name: /Sit completed/i }) })
      .locator("article")
      .filter({ has: page.getByRole("button", { name: /Archive .* sit/i }) })
      .first();
    await completedCard.getByRole("button", { name: /Archive .* sit/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("button", { name: /Yes, archive/i }).click();

    await expect(page.getByRole("heading", { name: /^Archived$/i })).toBeVisible();
    await page.getByLabel(/Filter sits by phase/i).selectOption("archived");
    await expect(page.getByRole("button", { name: /Restore .* sit/i }).first()).toBeVisible();
  });
});
