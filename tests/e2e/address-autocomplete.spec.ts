import { expect, test } from "@playwright/test";
import { seedVerifiedOwner } from "./helpers/auth";
import { openCreateSitModal } from "./helpers/sitEditor";

test.describe("sit full address autocomplete", () => {
  test("searches global addresses via the addresses API", async ({ page }) => {
    const api = await page.request.get("/api/addresses?q=Antibes&limit=5&lang=en");
    expect(api.ok()).toBeTruthy();
    const body = (await api.json()) as {
      data: Array<{ label: string; primary: string; secondary: string; city?: string }>;
    };
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data.some((row) => /antibes/i.test(row.label))).toBeTruthy();

    await seedVerifiedOwner(page);
    const modal = await openCreateSitModal(page);
    await modal.getByTestId("sit-use-normal-port-input").uncheck();
    const input = modal.getByTestId("sit-full-address-input");
    await input.click();
    await input.fill("Port Vauban Antibes");

    const list = page.getByTestId("address-suggestions");
    await expect(list).toBeVisible({ timeout: 15_000 });
    const option = list.getByTestId("address-option").first();
    await expect(option).toBeVisible();
    await option.click();

    await expect(input).not.toHaveValue("");
    await expect(list).toHaveCount(0);
    await expect(modal.getByTestId("sit-public-location")).toBeVisible();
  });

  test("resolves city and country from freeform text on blur", async ({ page }) => {
    await page.route("**/api/addresses**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: [
            {
              id: "mock-1",
              label: "Lefkas Marina, Lefkada, Greece",
              primary: "Lefkas Marina",
              secondary: "Lefkada, Greece",
              city: "Lefkada",
              country: "Greece",
              countryCode: "GR",
            },
          ],
        }),
      });
    });

    await seedVerifiedOwner(page);
    const modal = await openCreateSitModal(page);
    await modal.getByTestId("sit-use-normal-port-input").uncheck();
    const input = modal.getByTestId("sit-full-address-input");
    await input.fill("Berth A4, Lefkas Marina, Lefkada");
    await input.blur();
    await expect(modal.getByTestId("sit-public-location")).toContainText(/Lefkada/i);
    await expect(input).toHaveValue("Berth A4, Lefkas Marina, Lefkada");
  });
});
