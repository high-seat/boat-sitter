import { expect, test } from "@playwright/test";
import { seedVerifiedOwner } from "./helpers/auth";

test.describe("owner sit delete and archive", () => {
  test("warns when deleting a sit with an accepted applicant", async ({ page }) => {
    await seedVerifiedOwner(page);
    await page.goto("/my-sits");
    await expect(page.getByRole("heading", { name: /My sits/i })).toBeVisible();

    const sitCard = page
      .locator("article")
      .filter({ hasText: /Solstice/i })
      .first();
    await expect(sitCard).toBeVisible();
    await sitCard.getByRole("button", { name: /Delete .* sit/i }).click();

    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByText(/Someone has already been accepted.*inform them/i)).toBeVisible();
    await page.getByRole("button", { name: /Cancel/i }).click();
  });

  test("archives a completed sit into the Archived section", async ({ page }) => {
    await seedVerifiedOwner(page);
    await page.addInitScript(() => {
      const completed = {
        id: "sit-completed-archive-e2e",
        boatId: "solstice",
        dates: "Jan 2 – Jan 7",
        dateStart: "2026-01-02",
        duration: "5 nights",
        location: "Lefkada",
        country: "Greece",
        latitude: 38.7066,
        longitude: 20.7019,
        responsibilities: ["Check lines daily", "Air the cabin"],
        requirements: [],
        maxGuests: 2,
        applicants: 1,
        applicationsOpen: false,
      };
      localStorage.setItem("harbourly-sits", JSON.stringify([completed]));
      localStorage.setItem("boatstead-applications-v3", "complete");
      localStorage.setItem(
        "harbourly-applications",
        JSON.stringify([
          {
            id: "application-completed-archive-e2e",
            sitId: "sit-completed-archive-e2e",
            boatName: "Solstice",
            ownerName: "Maya & Finn",
            status: "accepted",
            createdAt: "2026-01-01T00:00:00.000Z",
            partySize: 1,
            applicant: {
              name: "Alex Morgan",
              image: "https://i.pravatar.cc/160?img=11",
              location: "Brighton, United Kingdom",
              bio: "Test sitter",
              languages: ["English"],
              preferredCountries: [],
              skills: [],
              yearsExperience: 5,
              certifications: [],
              memberSince: 2020,
              completedSits: 3,
            },
            messages: [
              {
                id: "message-completed-archive-e2e",
                senderName: "Alex Morgan",
                text: "Thanks for the completed stay.",
                createdAt: "2026-01-08T00:00:00.000Z",
              },
            ],
          },
        ]),
      );
    });

    await page.goto("/my-sits");
    await expect(page.getByRole("heading", { name: /Stay completed/i })).toBeVisible();

    const completedCard = page
      .locator("article")
      .filter({ has: page.getByRole("button", { name: /Archive .* sit/i }) })
      .first();
    await completedCard.getByRole("button", { name: /Archive .* sit/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("button", { name: /Yes, archive/i }).click();

    await expect(page.getByRole("heading", { name: /^Archived$/i })).toBeVisible();
    await page.getByLabel(/Filter sits by phase/i).selectOption("archived");
    await expect(page.getByRole("button", { name: /Restore .* sit/i }).first()).toBeVisible();
  });
});
