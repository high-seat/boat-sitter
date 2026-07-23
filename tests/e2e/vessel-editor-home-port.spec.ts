import { expect, test, type Locator, type Page } from "@playwright/test";
import { seedVerifiedOwner } from "./helpers/auth";

async function pickHomePort(page: Page, homePort: Locator, query: string, optionName: RegExp) {
  const input = page.getByTestId("vessel-home-port-input");
  await expect(input).toBeVisible();
  await input.click();
  await input.fill(query);
  const option = homePort.getByRole("option", { name: optionName }).first();
  await expect(option).toBeVisible({ timeout: 10_000 });
  await option.click();
  await expect(page.getByTestId("vessel-home-port-selected")).toContainText(optionName);
}

test.describe("vessel editor home port selection", () => {
  test("commits home port only from autocomplete suggestions", async ({ page }) => {
    await seedVerifiedOwner(page);
    await page.goto("/owner/boats/new");
    await expect(page.getByRole("heading", { name: /Add a boat/i })).toBeVisible();

    await expect(page.getByTestId("vessel-home-port-hint")).toContainText(
      /closest city or country/i,
    );

    const homePort = page.getByTestId("vessel-home-port");
    const input = page.getByTestId("vessel-home-port-input");
    const nameInput = page.locator("input.form-input").first();
    await expect
      .poll(async () => {
        const [nameBg, portBg] = await Promise.all([
          nameInput.evaluate((el) => getComputedStyle(el).backgroundColor),
          homePort.evaluate((el) => getComputedStyle(el).backgroundColor),
        ]);
        return nameBg === portBg ? nameBg : `${nameBg} !== ${portBg}`;
      })
      .toMatch(/rgb\(248,\s*245,\s*238\)/);
    await input.click();
    await expect(homePort.getByTestId("destination-suggestions")).toBeVisible();

    await input.fill("NotARealPortCityXYZ");
    await expect(homePort.getByTestId("destination-suggestions")).toBeHidden({
      timeout: 10_000,
    });
    await page.keyboard.press("Enter");
    await input.blur();
    await expect(input).toHaveValue("");

    await pickHomePort(page, homePort, "Lefk", /Lefkada/i);
    await expect(page.getByTestId("vessel-home-port-input")).toHaveCount(0);
    await expect(page.getByTestId("vessel-home-port-edit")).toBeVisible();

    await page.getByTestId("vessel-home-port-edit").click();
    await expect(page.getByTestId("vessel-home-port-input")).toBeVisible();
    await page.getByTestId("vessel-home-port-input").fill("Typed junk");
    await page.getByTestId("vessel-home-port-input").blur();
    await expect(page.getByTestId("vessel-home-port-selected")).toContainText(/Lefkada/i);

    await page.getByTestId("vessel-home-port-edit").click();
    await page.getByTestId("vessel-home-port-clear").click();
    await page.getByTestId("vessel-home-port-input").fill("Greec");
    const country = homePort
      .getByTestId("destination-option-country")
      .filter({ hasText: /Greece/i });
    await expect(country).toBeVisible({ timeout: 10_000 });
    await country.click();
    await expect(page.getByTestId("vessel-home-port-selected")).toHaveText(/^Greece$/i);
  });
});
