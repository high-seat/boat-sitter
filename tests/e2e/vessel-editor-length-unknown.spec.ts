import { expect, test } from "@playwright/test";
import { seedVerifiedOwner } from "./helpers/auth";

test.describe("vessel editor length unknown", () => {
  test("defaults to I don’t know and toggles the length inputs", async ({ page }) => {
    await seedVerifiedOwner(page);
    await page.goto("/owner/boats/new");
    await expect(page.getByRole("heading", { name: /Add a boat/i })).toBeVisible();

    const lengthValue = page.getByTestId("vessel-length-value");
    const lengthUnit = page.getByTestId("vessel-length-unit");
    const lengthUnknown = page.getByTestId("vessel-length-unknown");

    await expect(lengthUnknown).toBeChecked();
    await expect(lengthValue).toBeDisabled();
    await expect(lengthUnit).toBeDisabled();

    await lengthUnknown.uncheck();
    await expect(lengthValue).toBeEnabled();
    await expect(lengthUnit).toBeEnabled();

    await lengthValue.fill("12");
    await expect(lengthUnknown).not.toBeChecked();

    await lengthUnknown.check();
    await expect(lengthValue).toBeDisabled();
    await expect(lengthValue).toHaveValue("");
    await expect(lengthUnit).toBeDisabled();
  });
});
