import { expect, test } from "@playwright/test";
import { seedVerifiedOwner } from "./helpers/auth";
import { LIFECYCLE_SIT_ID, seedLifecycleSit } from "./helpers/fixtures";

function lifecycleOwnerCard(page: import("@playwright/test").Page) {
  return page.getByTestId(`owner-sit-card-${LIFECYCLE_SIT_ID}`);
}

test.describe("underway sit focuses on chat", () => {
  test("dashboard hides Applicants and sit screen hides prior applicants", async ({ page }) => {
    await seedVerifiedOwner(page);
    await seedLifecycleSit(page, "underway");

    await page.goto("/my-sits");
    const card = lifecycleOwnerCard(page);
    await expect(page.getByTestId("owner-sits-phase-stayUnderway")).toBeVisible();
    await expect(card).toBeVisible();
    await expect(card.getByTestId("sit-emergency-help")).toBeVisible();
    await expect(card.getByTestId("owner-sit-manage")).toBeVisible();

    await card.getByTestId("owner-sit-manage").click();
    await expect(page).toHaveURL(new RegExp(`/owner/sits/${LIFECYCLE_SIT_ID}/applications`));
    await expect(page.getByTestId("applications-heading")).toHaveText(/Sit with Alex Morgan/i);
    await expect(page.getByTestId("active-sit-boat-details-toggle")).toBeVisible();
    await expect(page.getByTestId("active-sit-vessel")).toHaveCount(0);
    await page.getByTestId("active-sit-boat-details-toggle").click();
    await expect(page.getByTestId("active-sit-vessel")).toBeVisible();
    await expect(page.getByTestId("active-sit-vessel-name")).toHaveText(/Solstice/i);
    await expect(page.getByTestId("active-sit-vessel-cover")).toBeVisible();
    await page.getByTestId("active-sit-vessel-cover").click();
    await expect(page.getByRole("dialog", { name: /Solstice photo gallery/i })).toBeVisible();
    await page.getByRole("button", { name: /^Close$/i }).click();
    await expect(page.getByRole("dialog", { name: /Solstice photo gallery/i })).toHaveCount(0);
    await page.getByTestId("active-sit-boat-details-toggle").click();
    await expect(page.getByTestId("active-sit-vessel")).toHaveCount(0);
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
    await expect(page.getByTestId("owner-sits-phase-applicantChosen")).toBeVisible();
    await expect(card).toBeVisible();
    await expect(card.getByRole("button", { name: /Start sit early/i })).toBeVisible();
    await expect(card.getByTestId("sit-emergency-help")).toHaveCount(0);

    await page.goto(`/owner/sits/${LIFECYCLE_SIT_ID}/applications`);
    await expect(page.getByTestId("applications-heading")).toHaveText(/Applications for/i);
    await expect(page.getByTestId("application-applicant-list")).toBeVisible();
    await expect(
      page.getByTestId("application-applicant-list").getByText("Prior Applicant E2E"),
    ).toBeVisible();
    await expect(page.getByTestId("active-sit-chat")).toHaveCount(0);
    await expect(page.getByTestId("active-sit-boat-details-toggle")).toBeVisible();
    await expect(page.getByTestId("active-sit-vessel")).toHaveCount(0);
    await page.getByTestId("active-sit-boat-details-toggle").click();
    await expect(page.getByTestId("active-sit-vessel")).toBeVisible();
    await expect(page.getByTestId("active-sit-vessel-name")).toHaveText(/Solstice/i);
  });
});
