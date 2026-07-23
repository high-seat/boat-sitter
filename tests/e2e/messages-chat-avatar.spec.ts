import { expect, test } from "@playwright/test";

test.describe("messages chat avatar", () => {
  test("shows the owner profile photo when the sitter opens the thread", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.clear();
      localStorage.setItem("i18nextLng", "en-US");
      localStorage.setItem(
        "harbourly",
        JSON.stringify({
          state: {
            saved: [],
            archivedConversations: [],
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
          version: 16,
        }),
      );
    });

    await page.goto("/messages");
    await expect(page.getByRole("heading", { name: /Messages/i })).toBeVisible();

    await page
      .getByRole("button", { name: /Jonas|Blue Hour/i })
      .first()
      .click();
    await expect(page.getByRole("link", { name: /^Jonas$/i })).toBeVisible();

    const avatar = page
      .getByRole("link", { name: /View profile/i })
      .first()
      .locator("img");
    await expect(avatar).toHaveAttribute("src", /pravatar\.cc|unsplash|cloudflare|images\./i);
    await expect(avatar).not.toHaveAttribute("src", /dicebear.*initials/i);
  });
});
