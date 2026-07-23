import { expect, test, type Locator } from "@playwright/test";
import { seedVerifiedOwner } from "./helpers/auth";

async function expectDisabledFieldLook(field: Locator) {
  await expect(field).toBeDisabled();
  await expect(field).toHaveCSS("cursor", "not-allowed");
  await expect(field).toHaveCSS("border-style", "dashed");
}

async function expectEnabledFieldLook(field: Locator) {
  await expect(field).toBeEnabled();
  await expect(field).toHaveCSS("border-style", "solid");
}

test.describe("vessel editor disabled inputs", () => {
  test("shows a clear disabled look when I don’t know is checked", async ({ page }) => {
    await seedVerifiedOwner(page);
    await page.goto("/owner/boats/new");
    await expect(page.getByRole("heading", { name: /Add a boat/i })).toBeVisible();

    const lengthValue = page.getByTestId("vessel-length-value");
    const lengthUnit = page.getByTestId("vessel-length-unit");
    const lengthUnknown = page.getByTestId("vessel-length-unknown");
    const yearBuilt = page.getByTestId("vessel-year-built");
    const yearUnknown = page.getByTestId("vessel-year-unknown");

    await expect(lengthUnknown).toBeChecked();
    await expect(yearUnknown).toBeChecked();
    await expectDisabledFieldLook(lengthValue);
    await expectDisabledFieldLook(lengthUnit);
    await expectDisabledFieldLook(yearBuilt);

    await page.getByTestId("vessel-length-fields").hover();
    await expect(
      page.getByRole("tooltip", { name: /Uncheck .*I don’t know.* to enter a length/i }),
    ).toBeVisible();

    await yearBuilt.hover({ force: true });
    await expect(
      page.getByRole("tooltip", { name: /Uncheck .*I don’t know.* to enter a year/i }),
    ).toBeVisible();

    await yearUnknown.uncheck();
    await expectEnabledFieldLook(yearBuilt);
    await yearBuilt.hover();
    await expect(page.getByRole("tooltip", { name: /enter a year/i })).toHaveCount(0);
    await yearBuilt.fill("2018");

    await yearUnknown.check();
    await expectDisabledFieldLook(yearBuilt);
    await expect(yearBuilt).toHaveValue("");

    await lengthUnknown.uncheck();
    await expectEnabledFieldLook(lengthValue);
    await expectEnabledFieldLook(lengthUnit);
    await page.getByTestId("vessel-length-fields").hover();
    await expect(page.getByRole("tooltip", { name: /enter a length/i })).toHaveCount(0);
  });
});
