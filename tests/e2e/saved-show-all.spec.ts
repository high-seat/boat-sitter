import { expect, test } from "@playwright/test";

test.describe("saved listings filter", () => {
  test("show-all checkbox switches open vs all saved listings", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.clear();
      localStorage.setItem("i18nextLng", "en-US");
      localStorage.setItem(
        "harbourly",
        JSON.stringify({
          state: {
            saved: ["solstice"],
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
      // Mark Solstice as accepted so the open filter hides it.
      localStorage.setItem(
        "harbourly-applications",
        JSON.stringify([
          {
            id: "application-alex-solstice",
            sitId: "solstice",
            boatName: "Solstice",
            ownerName: "Maya & Finn",
            status: "accepted",
            createdAt: "2026-07-18T10:00:00.000Z",
            partySize: 1,
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
            messages: [],
          },
        ]),
      );
      localStorage.setItem("boatstead-applications-v3", "complete");
    });

    await page.goto("/saved");
    await expect(page.getByRole("heading", { name: /Saved boat sits/i })).toBeVisible();

    const checkbox = page.getByLabel(/Show all including sitter chosen/i);
    await expect(checkbox).not.toBeChecked();
    await expect(page.getByRole("heading", { name: /No open saved sits/i })).toBeVisible();

    await checkbox.check();
    await expect(checkbox).toBeChecked();
    await expect(page.getByText(/^Solstice$/i).first()).toBeVisible();

    await checkbox.uncheck();
    await expect(page.getByRole("heading", { name: /No open saved sits/i })).toBeVisible();
  });
});
