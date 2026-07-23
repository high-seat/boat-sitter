import { expect, test } from "@playwright/test";
import { seedVerifiedOwner } from "./helpers/auth";
import { openCreateSitModal } from "./helpers/sitEditor";

test.describe("sit full address autocomplete", () => {
  test("searches global addresses via the addresses API", async ({ page }) => {
    const api = await page.request.get("/api/addresses?q=Antibes&limit=5&lang=en");
    expect(api.ok()).toBeTruthy();
    const body = (await api.json()) as {
      data: Array<{ label: string; primary: string; secondary: string }>;
    };
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data.some((row) => /antibes/i.test(row.label))).toBeTruthy();

    await seedVerifiedOwner(page);
    const modal = await openCreateSitModal(page);
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
  });

  test("keeps freeform berth text without requiring a suggestion", async ({ page }) => {
    await seedVerifiedOwner(page);
    const modal = await openCreateSitModal(page);
    const input = modal.getByTestId("sit-full-address-input");
    await input.fill("Berth A4, Demo Marina, Harbor Road 12");
    await expect(input).toHaveValue("Berth A4, Demo Marina, Harbor Road 12");
  });
});
