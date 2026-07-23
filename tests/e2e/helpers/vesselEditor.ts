import { expect, type Page } from "@playwright/test";

/** Pick a concrete vessel type (required on create; default is Not specified). */
export async function selectVesselType(page: Page, type: string = "Sailing yacht") {
  await page.getByTestId("vessel-type").selectOption(type);
}

/** Deterministic Photon-style address suggestions for vessel/sit editors. */
export async function mockAddressSuggestions(
  page: Page,
  suggestion: {
    label: string;
    primary: string;
    secondary: string;
    city: string;
    country: string;
    countryCode?: string;
  } = {
    label: "Lefkas Marina, Lefkada, Greece",
    primary: "Lefkas Marina",
    secondary: "Lefkada, Greece",
    city: "Lefkada",
    country: "Greece",
    countryCode: "GR",
  },
) {
  await page.route("**/api/addresses**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: [
          {
            id: "mock-1",
            label: suggestion.label,
            primary: suggestion.primary,
            secondary: suggestion.secondary,
            city: suggestion.city,
            country: suggestion.country,
            countryCode: suggestion.countryCode ?? "GR",
            latitude: 38.83,
            longitude: 20.71,
          },
        ],
      }),
    });
  });
}

/** Fill and pick a mocked port address in the vessel editor. */
export async function pickVesselPortAddress(
  page: Page,
  query = "Lefkas Marina",
  optionName: RegExp = /Lefkas Marina/i,
) {
  await mockAddressSuggestions(page);
  const input = page.getByTestId("vessel-port-address-input");
  await expect(input).toBeVisible();
  await input.click();
  await input.fill(query);
  const option = page.getByTestId("address-option").filter({ hasText: optionName }).first();
  await expect(option).toBeVisible({ timeout: 10_000 });
  await option.click();
  await expect(page.getByTestId("vessel-public-location")).toContainText(/Lefkada/i);
}
