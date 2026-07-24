import { expect, test } from "@playwright/test";
import { seedVerifiedOwner } from "./helpers/auth";
import { seedDevFixture } from "./helpers/fixtures";

test.describe("accept applicant phase transition", () => {
  test("accepting an applicant moves the sit to Applicant accepted", async ({ page }) => {
    await seedVerifiedOwner(page);
    await seedDevFixture(page, "reset-solstice-open");

    await page.goto("/owner/sits/solstice/applications");
    await expect(page.getByRole("heading", { name: /Applications for/i })).toBeVisible();
    await expect(page.getByText(/^Accepting applicants$/i).first()).toBeVisible();

    await page
      .getByRole("button", { name: /Samira Costa/i })
      .first()
      .click();
    await expect(page.getByRole("heading", { name: "Samira Costa" })).toBeVisible();
    await page.getByRole("button", { name: /^Accept$/i }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: /Accept Samira/i })).toBeVisible();
    await expect(dialog.getByText(/no longer allow others to submit applications/i)).toBeVisible();
    await expect(dialog.getByText(/no longer selecting applicants/i)).toBeVisible();
    await dialog.getByRole("button", { name: /Yes, accept/i }).click();

    await expect(page.getByText(/^Applicant accepted$/i).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: /Accepted applicant/i })).toBeVisible();
    await expect(page.getByTestId("application-list-not-considered")).toBeVisible();
    await expect(page.getByTestId("application-list-not-considered")).toContainText(
      /Samira Costa/i,
    );

    await page.goto("/my-sits");
    await expect(page.getByTestId("owner-sits-phase-applicantChosen")).toBeVisible();
    const solsticeCard = page.getByTestId("owner-sit-card-solstice");
    await expect(solsticeCard).toBeVisible();
    await expect(
      page.getByTestId("owner-sits-phase-applicantChosen").getByTestId("owner-sit-card-solstice"),
    ).toBeVisible();
  });
});
