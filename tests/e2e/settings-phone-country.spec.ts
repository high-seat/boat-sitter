import { expect, test } from "@playwright/test";
import { seedVerifiedOwner } from "./helpers/auth";

test.describe("settings phone country code", () => {
  test("defaults calling code from profile location when phone is empty", async ({ page }) => {
    await seedVerifiedOwner(page);
    await page.addInitScript(() => {
      const raw = localStorage.getItem("harbourly");
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        state: { user: { phoneNumber: string; phoneCountryCode: string; location: string } };
        version: number;
      };
      parsed.state.user.phoneNumber = "";
      parsed.state.user.phoneCountryCode = "+1";
      parsed.state.user.location = "Lefkada, Greece";
      parsed.version = 15;
      localStorage.setItem("harbourly", JSON.stringify(parsed));
    });

    await page.goto("/settings");
    await expect(page.getByRole("heading", { name: /^Account$/i })).toBeVisible();
    await expect(page.getByRole("textbox", { name: /Country calling code/i })).toHaveValue("+30");
  });

  test("updates calling code when location changes and phone is empty", async ({ page }) => {
    await seedVerifiedOwner(page);
    await page.addInitScript(() => {
      const raw = localStorage.getItem("harbourly");
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        state: { user: { phoneNumber: string; phoneCountryCode: string; location: string } };
      };
      parsed.state.user.phoneNumber = "";
      parsed.state.user.phoneCountryCode = "+30";
      parsed.state.user.location = "Lefkada, Greece";
      localStorage.setItem("harbourly", JSON.stringify(parsed));
    });

    await page.goto("/settings");
    const locationInput = page.getByPlaceholder(/Start typing a city/i);
    await locationInput.click();
    await locationInput.fill("Brighton");
    await page
      .getByRole("option", { name: /Brighton/i })
      .first()
      .click();
    await expect(page.getByRole("textbox", { name: /Country calling code/i })).toHaveValue("+44");
  });
});
