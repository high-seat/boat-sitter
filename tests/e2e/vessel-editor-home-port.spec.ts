import { expect, test } from "@playwright/test";
import { seedVerifiedOwner } from "./helpers/auth";
import { mockAddressSuggestions, pickVesselPortAddress } from "./helpers/vesselEditor";

test.describe("vessel editor port address", () => {
  test("derives public city and country from a street address pick", async ({ page }) => {
    await seedVerifiedOwner(page);
    await page.goto("/owner/boats/new");
    await expect(page.getByRole("heading", { name: /Add a boat/i })).toBeVisible();

    await expect(page.getByTestId("vessel-port-address-hint")).toContainText(
      /only the city and country are shown publicly/i,
    );

    await pickVesselPortAddress(page);
    await expect(page.getByTestId("vessel-port-address-input")).toHaveValue(/Lefkas Marina/i);
    await expect(page.getByTestId("vessel-public-location")).toContainText(/Lefkada,\s*Greece/i);

    await page.getByTestId("vessel-port-address-clear").click();
    await expect(page.getByTestId("vessel-port-address-input")).toHaveValue("");
    await expect(page.getByTestId("vessel-public-location")).toHaveCount(0);

    await mockAddressSuggestions(page, {
      label: "Port Vauban, Antibes, France",
      primary: "Port Vauban",
      secondary: "Antibes, France",
      city: "Antibes",
      country: "France",
      countryCode: "FR",
    });
    const input = page.getByTestId("vessel-port-address-input");
    await input.fill("Port Vauban");
    await page.getByTestId("address-option").first().click();
    await expect(page.getByTestId("vessel-public-location")).toContainText(/Antibes,\s*France/i);
  });
});
