import { expect, test } from "@playwright/test";
import { seedVerifiedOwner } from "./helpers/auth";
import { mockAddressSuggestions, selectVesselType } from "./helpers/vesselEditor";

test.describe("vessel editor live preview", () => {
  test("shows a live boat preview that updates with the name", async ({ page }) => {
    await seedVerifiedOwner(page);
    await page.goto("/owner/boats/new");
    await expect(page.getByRole("heading", { name: /Add a boat/i })).toBeVisible();

    const preview = page.getByRole("complementary", { name: /Live preview/i });
    await expect(preview).toBeVisible();
    await expect(preview.getByRole("heading", { name: /How it will look/i })).toBeVisible();
    await expect(preview.getByText(/^Live preview$/i)).toHaveCount(0);
    await expect(preview.getByTestId("vessel-preview-name")).toHaveText(/Untitled boat/i);
    await expect(preview.getByTestId("vessel-preview-location")).toHaveText(/Location unknown/i);
    await expect(preview.getByTestId("vessel-preview-type-length")).toHaveText("");
    await expect(preview.getByTestId("vessel-preview-length-unit-hint")).toHaveText(
      /Length is shown in feet or meters based on each member's preference/i,
    );

    await page.getByPlaceholder(/e\.g\. Solstice/i).fill("Preview Wind");
    await expect(preview.getByTestId("vessel-preview-name")).toHaveText("Preview Wind");

    await selectVesselType(page, "Sailing yacht");
    await expect(preview.getByTestId("vessel-preview-type-length")).toHaveText(/^Sailing yacht$/i);
    await expect(preview.getByTestId("vessel-preview-type-length")).not.toHaveText(/·/);

    await page.getByTestId("vessel-length-unknown").uncheck();
    await page.getByTestId("vessel-length-value").fill("12");
    await expect(preview.getByTestId("vessel-preview-type-length")).toHaveText(
      /Sailing yacht · 12 m/i,
    );

    await mockAddressSuggestions(page, {
      label: "Port Vauban, Antibes, France",
      primary: "Port Vauban",
      secondary: "Antibes, France",
      city: "Antibes",
      country: "France",
      countryCode: "FR",
    });
    await page.getByTestId("vessel-port-address-input").click();
    await page.getByTestId("vessel-port-address-input").fill("Port Vauban");
    await page.getByTestId("address-option").first().click();
    await expect(preview.getByTestId("vessel-preview-location")).toContainText(/Antibes/i);
    await expect(preview.getByTestId("vessel-preview-location")).not.toHaveText(
      /Location unknown/i,
    );
  });

  test("truncates an oversized boat name in the live preview", async ({ page }) => {
    await seedVerifiedOwner(page);
    await page.goto("/owner/boats/new");

    const longName = "A".repeat(100);
    await page.getByPlaceholder(/e\.g\. Solstice/i).fill(longName);

    const previewName = page.getByTestId("vessel-preview-name");
    await expect(previewName).toHaveText(longName);
  });
});
