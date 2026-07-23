import { expect, test } from "@playwright/test";

test.describe("withdraw with explanation", () => {
  test("sitter can withdraw with an optional one-time explanation", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.clear();
      localStorage.setItem("i18nextLng", "en-US");
      localStorage.setItem(
        "harbourly",
        JSON.stringify({
          state: {
            saved: [],
            archivedConversations: [],
            deletedConversations: [],
            archivedSits: [],
            blockedUsers: [],
            userReports: [],
            user: {
              name: "Alex Morgan",
              email: "alex.morgan@boatstead.mock",
              emailConfirmed: true,
              legalName: "Alex Morgan",
              image: "https://i.pravatar.cc/160?img=11",
              bio: "Sitter",
              location: "Brighton, United Kingdom",
              languages: ["English"],
              preferredCountries: [],
              skills: [],
              preferredLanguage: "en-US",
              measurementSystem: "metric",
              emailNotifications: {
                newApplications: true,
                applicationUpdates: true,
                messages: true,
                sitReminders: true,
                productUpdates: false,
              },
              sitDefaults: { nonSmokerRequired: false },
              memberSince: 2020,
              phoneCountryCode: "+44",
              phoneNumber: "7700900123",
              role: "member",
            },
          },
          version: 15,
        }),
      );
    });

    await page.goto("/my-sits");
    await expect(page.getByRole("heading", { name: /My sits/i })).toBeVisible();

    const activeCard = page
      .locator("article")
      .filter({ hasText: /Solstice/i })
      .first();
    await expect(activeCard.getByRole("button", { name: /Withdraw interest/i })).toBeVisible();
    await activeCard.getByRole("button", { name: /Withdraw interest/i }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: /Withdraw your interest/i })).toBeVisible();
    await expect(dialog.getByLabel(/Optional explanation/i)).toBeVisible();
    await dialog
      .getByLabel(/Optional explanation/i)
      .fill("Dates no longer work for me after a schedule change.");
    await dialog.getByRole("button", { name: /Yes, withdraw/i }).click();

    await expect(page.getByRole("heading", { name: /^Withdrawn$/i })).toBeVisible();
    const withdrawnCard = page
      .locator("section")
      .filter({ has: page.getByRole("heading", { name: /^Withdrawn$/i }) })
      .locator("article")
      .filter({ hasText: /Solstice/i });
    await expect(withdrawnCard).toBeVisible();

    await withdrawnCard.getByRole("link", { name: /^Messages$/i }).click();
    await expect(page.getByText(/Interest withdrawn/i).first()).toBeVisible();
    await expect(page.getByText(/You withdrew your interest in this sit/i).first()).toBeVisible();
    await expect(
      page.getByText(/Dates no longer work for me after a schedule change/i).first(),
    ).toBeVisible();
  });
});
