import { expect, test } from "@playwright/test";
import { seedOwnerSession, seedVerifiedOwner } from "./helpers/auth";
import { seedDevFixture } from "./helpers/fixtures";

test.describe("shortlist is owner-only", () => {
  test("applicant never sees Shortlisted status", async ({ page, browser }) => {
    await seedVerifiedOwner(page);
    await seedDevFixture(page, "reset-solstice-open");

    await page.goto("/owner/sits/solstice/applications");
    await expect(page.getByRole("heading", { name: /Applications for/i })).toBeVisible();
    await page
      .getByRole("button", { name: /Alex Morgan/i })
      .first()
      .click();
    await expect(page.getByRole("heading", { name: "Alex Morgan" })).toBeVisible();

    const shortlist = page.getByRole("checkbox", { name: /Shortlist/i });
    await expect(shortlist).toBeChecked();
    await expect(
      page
        .locator("span")
        .filter({ hasText: /^Shortlisted$/i })
        .first(),
    ).toBeVisible();

    const sitterContext = await browser.newContext();
    const sitterPage = await sitterContext.newPage();
    await seedOwnerSession(sitterPage, {
      name: "Alex Morgan",
      email: "alex.morgan@boatstead.mock",
      image: "https://i.pravatar.cc/160?img=11",
      phoneNumber: "7700900123",
      verified: true,
    });

    await sitterPage.goto("/my-sits");
    const solsticeCard = sitterPage
      .locator("article")
      .filter({ hasText: /Solstice/i })
      .first();
    await expect(solsticeCard).toBeVisible();
    await expect(solsticeCard.getByText(/^Shortlisted$/i)).toHaveCount(0);
    await expect(solsticeCard.getByText(/^New$/i)).toBeVisible();

    await sitterPage.goto("/messages?application=application-alex-solstice");
    await expect(sitterPage.getByText(/^Shortlisted$/i)).toHaveCount(0);
    await expect(sitterPage.getByText(/^New$/i).first()).toBeVisible();

    await sitterPage.goto("/boats/solstice");
    await expect(sitterPage.getByText(/^Shortlisted$/i)).toHaveCount(0);

    await sitterContext.close();
  });
});
