import { expect, test } from "@playwright/test";
import { seedVerifiedOwner } from "./helpers/auth";
import { openCreateSitModal } from "./helpers/sitEditor";

test.describe("create editor discard confirmation", () => {
  test("confirms before leaving a dirty new boat form", async ({ page }) => {
    await seedVerifiedOwner(page);
    await page.goto("/owner/boats/new");
    await expect(page.getByRole("heading", { name: /Add a boat/i })).toBeVisible();

    await page.getByTestId("vessel-editor-back").click();
    await expect(page.getByTestId("editor-discard-dialog")).toHaveCount(0);
    await expect(page).toHaveURL(/\/my-boats/);

    await page.goto("/owner/boats/new");
    await page.getByLabel(/Boat name/i).fill("Half Built Cutter");
    await page.getByTestId("vessel-editor-cancel").click();
    const dialog = page.getByTestId("editor-discard-dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("heading", { name: /Discard your progress/i })).toBeVisible();

    await dialog.getByRole("button", { name: /Keep editing/i }).click();
    await expect(dialog).toHaveCount(0);
    await expect(page).toHaveURL(/\/owner\/boats\/new/);
    await expect(page.getByLabel(/Boat name/i)).toHaveValue("Half Built Cutter");

    await page.getByTestId("vessel-editor-back").click();
    await expect(page.getByTestId("editor-discard-dialog")).toBeVisible();
    await page
      .getByTestId("editor-discard-dialog")
      .getByRole("button", { name: /^Discard$/i })
      .click();
    await expect(page).toHaveURL(/\/my-boats/);
  });

  test("confirms before leaving a dirty new sit form", async ({ page }) => {
    await seedVerifiedOwner(page);
    await openCreateSitModal(page);

    await page.getByTestId("sit-editor-back").click();
    await expect(page.getByTestId("editor-discard-dialog")).toHaveCount(0);
    await expect(page).toHaveURL(/\/my-sits/);

    await openCreateSitModal(page);
    await page.getByTestId("sit-full-address").fill("Pier 4, berth 12");

    await page.getByTestId("sit-editor-cancel").click();
    const dialog = page.getByTestId("editor-discard-dialog");
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: /Keep editing/i }).click();
    await expect(page).toHaveURL(/\/owner\/sits\/new/);
    await expect(page.getByTestId("sit-full-address")).toHaveValue("Pier 4, berth 12");

    await page.getByTestId("sit-editor-back").click();
    await expect(page.getByTestId("editor-discard-dialog")).toBeVisible();
    await page
      .getByTestId("editor-discard-dialog")
      .getByRole("button", { name: /^Discard$/i })
      .click();
    await expect(page).toHaveURL(/\/my-sits/);
  });
});
