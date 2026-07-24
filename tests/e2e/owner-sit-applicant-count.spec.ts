import { expect, test } from "@playwright/test";
import { seedVerifiedOwner } from "./helpers/auth";
import { seedDevFixture } from "./helpers/fixtures";

test.describe("owner sit applicant count", () => {
  test("my sits summary matches manage screen applicant total", async ({ page }) => {
    await seedVerifiedOwner(page);
    await seedDevFixture(page, "reset-solstice-open");

    await page.goto("/my-sits");
    const sitCard = page.getByTestId("owner-sit-card-solstice");
    await expect(sitCard).toBeVisible();

    const summary = sitCard.getByTestId("owner-sit-summary-solstice");
    await expect(summary).toBeVisible();
    await expect(summary).toHaveText(/2 applicants/);

    await sitCard.getByTestId("owner-sit-manage").click();
    await expect(page).toHaveURL(/\/owner\/sits\/solstice\/applications/);
    await expect(page.getByTestId("applications-subtitle")).toHaveText(
      /2 people have reached out about this sit/i,
    );
  });

  test("my sits summary uses singular applicant when count is 1", async ({ page }) => {
    await seedVerifiedOwner(page);
    await seedDevFixture(page, "underway-sit");

    await page.goto("/my-sits");
    const sitCard = page.getByTestId("owner-sit-card-sit-underway-emergency-e2e");
    await expect(sitCard).toBeVisible();

    const summary = sitCard.getByTestId("owner-sit-summary-sit-underway-emergency-e2e");
    await expect(summary).toBeVisible();
    await expect(summary).toHaveText(/1 applicant(?!s)/);
    await expect(summary).not.toHaveText(/1 applicants/);
  });
});
