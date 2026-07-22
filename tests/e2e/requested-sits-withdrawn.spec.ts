import { expect, test } from "@playwright/test";

test.describe("withdrawn requested sits", () => {
  test("moves withdrawn applications into a separate section", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.clear();
      localStorage.setItem("i18nextLng", "en-US");
      localStorage.setItem("harbourly-language", "en-US");
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
          version: 14,
        }),
      );
      localStorage.setItem("boatstead-applications-v3", "complete");
      localStorage.setItem(
        "harbourly-applications",
        JSON.stringify([
          {
            id: "application-alex-solstice",
            sitId: "solstice",
            boatName: "Solstice",
            ownerName: "Maya & Finn",
            status: "withdrawn",
            createdAt: "2026-07-18T10:00:00.000Z",
            partySize: 1,
            initialMessage: "Interested in Solstice.",
            applicant: {
              name: "Alex Morgan",
              image: "https://i.pravatar.cc/160?img=11",
              location: "Brighton, United Kingdom",
              bio: "Sitter",
              languages: ["English"],
              preferredCountries: [],
              skills: [],
              yearsExperience: 7,
              certifications: [],
              memberSince: 2020,
              completedSits: 8,
            },
            messages: [
              {
                id: "message-withdrawn",
                senderName: "Alex Morgan",
                text: "Interested in Solstice.",
                createdAt: "2026-07-18T10:00:00.000Z",
              },
            ],
          },
          {
            id: "application-alex-blue-hour",
            sitId: "blue-hour",
            boatName: "Blue Hour",
            ownerName: "Jonas",
            status: "accepted",
            createdAt: "2026-07-19T10:00:00.000Z",
            partySize: 1,
            initialMessage: "Interested in Blue Hour.",
            applicant: {
              name: "Alex Morgan",
              image: "https://i.pravatar.cc/160?img=11",
              location: "Brighton, United Kingdom",
              bio: "Sitter",
              languages: ["English"],
              preferredCountries: [],
              skills: [],
              yearsExperience: 7,
              certifications: [],
              memberSince: 2020,
              completedSits: 8,
            },
            messages: [
              {
                id: "message-active",
                senderName: "Alex Morgan",
                text: "Interested in Blue Hour.",
                createdAt: "2026-07-19T10:00:00.000Z",
              },
            ],
          },
        ]),
      );
    });

    await page.goto("/owner/boats");
    await expect(page.getByRole("heading", { name: /Manage boats/i })).toBeVisible();

    const requested = page.locator("section").filter({
      has: page.getByRole("heading", { name: /^Requested sits$/i }),
    });
    const withdrawn = page.locator("section").filter({
      has: page.getByRole("heading", { name: /^Withdrawn$/i }),
    });

    await expect(requested).toBeVisible();
    await expect(withdrawn).toBeVisible();
    await expect(requested.locator("article").filter({ hasText: /Solstice/i })).toHaveCount(0);
    await expect(withdrawn.locator("article").filter({ hasText: /Solstice/i })).toHaveCount(1);
    await expect(withdrawn.getByText(/^Withdrawn$/i).first()).toBeVisible();
    await expect(requested.getByText(/^Accepted$/i).first()).toBeVisible();
    await expect(requested.locator("article").filter({ hasText: /Withdrawn/i })).toHaveCount(0);
    await expect(
      withdrawn.locator("article").filter({ hasText: /Solstice/i }).getByRole("img").first(),
    ).toBeVisible();
    await expect(
      requested.locator("article").getByRole("img").first(),
    ).toBeVisible();
  });
});
