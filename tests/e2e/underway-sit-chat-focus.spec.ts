import { expect, test } from "@playwright/test";
import { seedVerifiedOwner } from "./helpers/auth";
import { LIFECYCLE_SIT_ID, seedLifecycleSit } from "./helpers/fixtures";

function lifecycleOwnerCard(page: import("@playwright/test").Page) {
  return page
    .locator("article")
    .filter({ has: page.locator(`a[href*="/boats/${LIFECYCLE_SIT_ID}"]`) })
    .first();
}

test.describe("underway sit focuses on chat", () => {
  test("dashboard hides Applicants and sit screen hides prior applicants", async ({ page }) => {
    await seedVerifiedOwner(page);
    await seedLifecycleSit(page, "underway");

    await page.goto("/my-sits");
    const card = lifecycleOwnerCard(page);
    await expect(card.getByText(/^Sit underway$/i)).toBeVisible();
    await expect(card.getByTestId("owner-sit-applicants")).toHaveCount(0);
    await expect(card.getByTestId("owner-sit-messages")).toBeVisible();

    await card.getByTestId("owner-sit-messages").click();
    await expect(page).toHaveURL(new RegExp(`/owner/sits/${LIFECYCLE_SIT_ID}/applications`));
    await expect(page.getByRole("heading", { name: /Sit with Alex Morgan/i })).toBeVisible();
    await expect(page.getByTestId("active-sit-chat")).toBeVisible();
    await expect(page.getByTestId("conversation-messages")).toBeVisible();
    await expect(page.getByTestId("application-applicant-list")).toHaveCount(0);
    await expect(page.getByText("Prior Applicant E2E")).toHaveCount(0);
    await expect(page.getByTestId("sit-emergency-help").first()).toBeVisible();
  });

  test("accepted phase still shows applicants list including prior applicants", async ({
    page,
  }) => {
    await seedVerifiedOwner(page);
    await seedLifecycleSit(page, "accepted");

    await page.goto("/my-sits");
    const card = lifecycleOwnerCard(page);
    await expect(card.getByTestId("owner-sit-applicants")).toBeVisible();
    await expect(card.getByTestId("owner-sit-messages")).toHaveCount(0);

    await page.goto(`/owner/sits/${LIFECYCLE_SIT_ID}/applications`);
    await expect(page.getByRole("heading", { name: /Applications for/i })).toBeVisible();
    await expect(page.getByTestId("application-applicant-list")).toBeVisible();
    await expect(
      page.getByTestId("application-applicant-list").getByText("Prior Applicant E2E"),
    ).toBeVisible();
    await expect(page.getByTestId("active-sit-chat")).toHaveCount(0);
  });
});
