import { expect, test } from "@playwright/test";
import { seedVerifiedOwner } from "./helpers/auth";
import { openCreateSitModal } from "./helpers/sitEditor";

test.describe("editor required vs optional fields", () => {
  test("create boat marks required fields and shows optional hint", async ({ page }) => {
    await seedVerifiedOwner(page);
    await page.goto("/owner/boats/new");

    const hint = page.getByTestId("editor-required-fields-hint");
    await expect(hint).toBeVisible();
    await expect(hint).toHaveText(
      /Required fields are marked with \*\. Everything else is optional\./i,
    );
    await expect(hint.locator("span[aria-hidden='true']")).toHaveCSS("color", "rgb(239, 112, 87)");
    await expect(page.getByTestId("vessel-cover").locator("span.font-bold.text-coral")).toHaveCSS(
      "color",
      "rgb(239, 112, 87)",
    );

    const requiredLabels = page.getByTestId("form-label-required");
    await expect(requiredLabels.filter({ hasText: /Boat name/i })).toContainText("*");
    await expect(requiredLabels.filter({ hasText: /Home port/i })).toContainText("*");
    await expect(requiredLabels.filter({ hasText: /Cover image/i })).toContainText("*");
    await expect(requiredLabels.filter({ hasText: /Vessel type/i })).toContainText("*");
    await expect(page.getByTestId("vessel-type")).toHaveValue("Not specified");

    await expect(page.getByRole("heading", { name: /What’s available/i })).toContainText(
      /optional/i,
    );
  });

  test("create sit marks required fields and shows optional hint", async ({ page }) => {
    await seedVerifiedOwner(page);
    const editor = await openCreateSitModal(page);

    const hint = editor.getByTestId("editor-required-fields-hint");
    await expect(hint).toBeVisible();
    await expect(hint).toHaveText(
      /Required fields are marked with \*\. Everything else is optional\./i,
    );

    const requiredLabels = editor.getByTestId("form-label-required");
    await expect(requiredLabels.filter({ hasText: /^Boat/i })).toContainText("*");
    await expect(requiredLabels.filter({ hasText: /Sit location/i })).toContainText("*");
    await expect(requiredLabels.filter({ hasText: /Full address/i })).toContainText("*");
    await expect(requiredLabels.filter({ hasText: /Sit dates/i })).toContainText("*");
    await expect(requiredLabels.filter({ hasText: /Sit type/i })).toContainText("*");
    await expect(requiredLabels.filter({ hasText: /Maximum number of people/i })).toContainText(
      "*",
    );

    await editor.getByRole("radio", { name: /Daytime checks/i }).check();
    await expect(editor.getByTestId("sit-editor-max-guests")).toHaveCount(0);

    await editor.getByRole("radio", { name: /Accommodation/i }).check();
    await expect(editor.getByTestId("sit-editor-max-guests")).toBeVisible();
    await expect(requiredLabels.filter({ hasText: /Maximum number of people/i })).toContainText(
      "*",
    );

    const maxGuests = editor.getByTestId("sit-editor-max-guests");
    const pets = editor.getByTestId("sit-editor-pets");
    await expect(pets).toBeVisible();
    const maxGuestsBox = await maxGuests.boundingBox();
    const petsBox = await pets.boundingBox();
    expect(maxGuestsBox && petsBox && petsBox.y > maxGuestsBox.y).toBeTruthy();
    if (maxGuestsBox && petsBox) {
      // Field labels are block-level so space-y-5 (~20px) applies between fields.
      expect(petsBox.y - (maxGuestsBox.y + maxGuestsBox.height)).toBeGreaterThanOrEqual(16);
    }

    const optionalLabels = editor.getByTestId("form-label-optional");
    await expect(optionalLabels.filter({ hasText: /Pets aboard/i })).toContainText(/optional/i);
    await expect(
      editor.getByRole("heading", { name: /Who is a good fit for this sit/i }),
    ).toContainText(/optional/i);
  });
});
