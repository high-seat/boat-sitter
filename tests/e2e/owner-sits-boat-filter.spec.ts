import { expect, test } from "@playwright/test";
import { seedVerifiedOwner } from "./helpers/auth";
import { seedDevFixture } from "./helpers/fixtures";

test.describe("owner sits boat filter", () => {
  test("filters hosted sits with the shared vessel picker", async ({ page }) => {
    await seedVerifiedOwner(page);
    await seedDevFixture(page, "reset-solstice-open");
    await seedDevFixture(page, "owner-second-boat");

    await page.goto("/my-sits");

    const boatFilter = page.getByTestId("owner-sits-boat-filter");
    await expect(boatFilter).toBeVisible();
    await expect(page.getByTestId("owner-sits-phase-filter")).toBeVisible();
    await expect(page.getByTestId("owner-sit-card-solstice")).toBeVisible();
    await expect(page.getByTestId("owner-sit-card-harbor-light")).toBeVisible();

    await boatFilter.getByRole("button", { name: /Filter sits by boat/i }).click();
    await page.getByTestId("vessel-picker-option-solstice-boat").click();

    await expect(page.getByTestId("owner-sit-card-solstice")).toBeVisible();
    await expect(page.getByTestId("owner-sit-card-harbor-light")).toHaveCount(0);
    await expect(boatFilter.getByRole("button", { name: /Filter sits by boat/i })).toContainText(
      /Solstice/i,
    );

    await boatFilter.getByRole("button", { name: /Filter sits by boat/i }).click();
    await page.getByTestId("vessel-picker-option-harbor-light-boat").click();

    await expect(page.getByTestId("owner-sit-card-harbor-light")).toBeVisible();
    await expect(page.getByTestId("owner-sit-card-solstice")).toHaveCount(0);

    await boatFilter.getByRole("button", { name: /Filter sits by boat/i }).click();
    await page.getByTestId("vessel-picker-option-all").click();

    await expect(page.getByTestId("owner-sit-card-solstice")).toBeVisible();
    await expect(page.getByTestId("owner-sit-card-harbor-light")).toBeVisible();
  });
});
