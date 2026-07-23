import { expect, test } from "@playwright/test";
import { seedVerifiedOwner } from "./helpers/auth";

const UNDERWAY_SIT = {
  id: "sit-underway-emergency-e2e",
  boatId: "solstice",
  dates: "Jul 20 – Jul 30",
  dateStart: "2026-07-20",
  duration: "14 nights",
  location: "Lefkada",
  country: "Greece",
  latitude: 38.7066,
  longitude: 20.7019,
  responsibilities: ["Check lines daily"],
  requirements: [],
  maxGuests: 2,
  applicants: 1,
  applicationsOpen: false,
};

const UNDERWAY_APPLICATION = {
  id: "application-underway-emergency-e2e",
  sitId: "sit-underway-emergency-e2e",
  boatName: "Solstice",
  ownerName: "Maya & Finn",
  ownerImage: "https://i.pravatar.cc/160?img=5",
  status: "accepted",
  createdAt: "2026-07-01T00:00:00.000Z",
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
      id: "message-underway-emergency-e2e",
      senderName: "Alex Morgan",
      text: "On board and settling in.",
      createdAt: "2026-07-20T10:00:00.000Z",
    },
  ],
};

async function seedUnderwaySit(page: import("@playwright/test").Page) {
  await page.addInitScript(
    ({ sit, application }) => {
      localStorage.setItem("harbourly-sits", JSON.stringify([sit]));
      localStorage.setItem("boatstead-applications-v3", "complete");
      localStorage.setItem("harbourly-applications", JSON.stringify([application]));
    },
    { sit: UNDERWAY_SIT, application: UNDERWAY_APPLICATION },
  );
}

test.describe("sit emergency help during underway", () => {
  test("owner can open emergency guidance from My sits", async ({ page }) => {
    await seedVerifiedOwner(page);
    await seedUnderwaySit(page);

    await page.goto("/my-sits");
    await expect(page.getByTestId("sit-emergency-help").first()).toBeVisible();
    await page.getByTestId("sit-emergency-help").first().click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("heading", { name: /In an emergency/i })).toBeVisible();
    await expect(dialog.getByText(/call local emergency services/i)).toBeVisible();
    await expect(dialog.getByText(/^Police$/i)).toBeVisible();
    await expect(dialog.getByText(/^Ambulance$/i)).toBeVisible();
    await dialog.getByRole("button", { name: /Got it/i }).click();
    await expect(dialog).toHaveCount(0);
  });

  test("sitter can open emergency guidance from My sits and Messages", async ({ page }) => {
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
    await seedUnderwaySit(page);

    await page.goto("/my-sits");
    await expect(page.getByTestId("sit-emergency-help").first()).toBeVisible();
    await page.getByTestId("sit-emergency-help").first().click();
    await expect(page.getByRole("dialog").getByRole("heading", { name: /In an emergency/i })).toBeVisible();
    await page.getByRole("dialog").getByRole("button", { name: /Got it/i }).click();

    await page.goto("/messages?application=application-underway-emergency-e2e");
    await expect(page.getByTestId("sit-emergency-help")).toBeVisible();
    await page.getByTestId("sit-emergency-help").click();
    await expect(page.getByRole("dialog").getByText(/Ambulance/i)).toBeVisible();
  });
});
