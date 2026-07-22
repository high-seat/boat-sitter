import { expect, test, type Browser, type Page } from "@playwright/test";
import { seedVerifiedOwner } from "./helpers/auth";

function futureDateIso(daysAhead: number) {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

async function openAlexMessagesWithSharedData(
  browser: Browser,
  storage: Record<string, string>,
) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.addInitScript((shared) => {
    localStorage.clear();
    localStorage.setItem("i18nextLng", "en-US");
    localStorage.setItem("harbourly-language", "en-US");
    for (const [key, value] of Object.entries(shared)) {
      localStorage.setItem(key, value);
    }
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
  }, storage);
  await page.goto("/messages");
  return { context, page };
}

test.describe("video call scheduling", () => {
  test("owner proposes a date, time, and duration", async ({ page }) => {
    await seedVerifiedOwner(page);
    await page.goto("/owner/sits/solstice/applications");
    await expect(page.getByRole("heading", { name: /Applications for/i })).toBeVisible();

    // Ensure Alex's accepted thread is selected.
    await page.getByRole("button", { name: /Alex Morgan/i }).first().click();
    await page.getByRole("button", { name: /Request video call/i }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: /Propose a video call/i })).toBeVisible();

    await dialog.locator('input[type="date"]').fill(futureDateIso(3));
    await dialog.locator('input[type="time"]').fill("14:30");
    await dialog.locator("select").selectOption("45");
    await dialog.getByRole("button", { name: /Send proposal/i }).click();

    await expect(page.getByText(/Video call proposed/i).first()).toBeVisible();
    await expect(page.getByText(/Maya & Finn proposed a video call/i).first()).toBeVisible();
    await expect(page.getByText(/45 minutes/i).first()).toBeVisible();
  });

  test("other party can suggest a different time", async ({ page, browser }) => {
    await seedVerifiedOwner(page);
    await page.goto("/owner/sits/solstice/applications");
    await page.getByRole("button", { name: /Alex Morgan/i }).first().click();
    await page.getByRole("button", { name: /Request video call/i }).click();
    const dialog = page.getByRole("dialog");
    await dialog.locator('input[type="date"]').fill(futureDateIso(2));
    await dialog.locator('input[type="time"]').fill("11:00");
    await dialog.getByRole("button", { name: /Send proposal/i }).click();
    await expect(page.getByText(/Video call proposed/i).first()).toBeVisible();

    const shared = await page.evaluate(() => {
      const keys = [
        "harbourly-applications",
        "harbourly-vessels",
        "harbourly-sits",
        "harbourly-boats",
        "boatstead-applications-v3",
      ];
      return Object.fromEntries(
        keys
          .map((key) => [key, localStorage.getItem(key)] as const)
          .filter((entry): entry is [string, string] => entry[1] != null),
      );
    });

    const { context, page: sitterPage } = await openAlexMessagesWithSharedData(browser, shared);
    try {
      await expect(sitterPage.getByRole("heading", { name: /Messages/i })).toBeVisible();
      await sitterPage.getByRole("button", { name: /Maya|Solstice/i }).first().click();
      await expect(sitterPage.getByRole("button", { name: /Accept time/i })).toBeVisible();
      await sitterPage.getByRole("button", { name: /Suggest different time/i }).click();
      const adjust = sitterPage.getByRole("dialog");
      await expect(
        adjust.getByRole("heading", { name: /Suggest a different time/i }),
      ).toBeVisible();
      await adjust.locator('input[type="date"]').fill(futureDateIso(4));
      await adjust.locator('input[type="time"]').fill("16:00");
      await adjust.locator("select").selectOption("30");
      await adjust.getByRole("button", { name: /Send new time/i }).click();
      await expect(sitterPage.getByText(/New time suggested/i).first()).toBeVisible();
      await expect(
        sitterPage.getByText(/Alex Morgan suggested a different time/i).first(),
      ).toBeVisible();
    } finally {
      await context.close();
    }
  });
});
