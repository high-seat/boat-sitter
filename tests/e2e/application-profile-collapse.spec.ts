import { expect, test } from "@playwright/test";
import { seedVerifiedOwner } from "./helpers/auth";

test.describe("application profile card", () => {
  test("starts collapsed and keeps the initial message in chat", async ({ page }) => {
    await seedVerifiedOwner(page);
    await page.goto("/owner/sits/solstice/applications");
    await expect(page.getByRole("heading", { name: /Applications for/i })).toBeVisible();

    const profile = page.getByTestId("application-profile-card");
    await expect(profile).toBeVisible();
    await expect(page.getByTestId("application-profile-summary")).toBeVisible();
    await expect(page.getByTestId("application-profile-details")).toHaveCount(0);
    await expect(profile.getByText(/Initial message/i)).toHaveCount(0);
    const headerActions = page.getByTestId("application-profile-actions");
    await expect(headerActions.getByRole("link", { name: /View full profile/i })).toBeVisible();
    await expect(headerActions.getByRole("button", { name: /Report/i })).toBeVisible();
    await expect(headerActions.getByRole("button", { name: /Block/i })).toBeVisible();

    const messages = page.getByTestId("conversation-messages");
    await expect(messages).toBeVisible();
    await expect(messages.getByText(/Hello, Solstice looks wonderful/i)).toBeVisible();

    await page.getByTestId("application-profile-details-toggle").click();
    await expect(page.getByTestId("application-profile-details")).toBeVisible();
    await expect(page.getByTestId("application-profile-bio")).toBeVisible();
    await expect(page.getByTestId("application-profile-bio")).toHaveText(/Offshore crew member/i);
    await expect(profile.getByText(/Initial message/i)).toHaveCount(0);

    await page.getByTestId("application-profile-details-toggle").click();
    await expect(page.getByTestId("application-profile-details")).toHaveCount(0);
  });
});
