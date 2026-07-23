import { expect, test } from "@playwright/test";
import { seedVerifiedOwner } from "./helpers/auth";
import { uploadVesselCover } from "./helpers/images";
import { selectVesselType } from "./helpers/vesselEditor";

test.describe("vessel publish create sit now", () => {
  test("shows sit note and navigates to sit creation when checkbox is checked", async ({
    page,
  }) => {
    await seedVerifiedOwner(page);
    await page.goto("/owner/boats/new");
    await expect(page.getByRole("heading", { name: /Add a boat/i })).toBeVisible();

    await expect(page.getByTestId("vessel-publish-sit-note")).toContainText(
      /will not appear on the site until you create a sit/i,
    );
    const createSitNow = page.getByTestId("vessel-create-sit-now-input");
    await expect(createSitNow).toBeChecked();

    await page.getByLabel(/Boat name/i).fill("Sit Now Cutter");
    await page.getByTestId("vessel-home-port-input").click();
    await page.getByTestId("vessel-home-port-input").fill("Lefk");
    await page
      .getByRole("option", { name: /Lefkada/i })
      .first()
      .click();
    await expect(page.getByTestId("vessel-home-port-selected")).toContainText(/Lefkada/i);
    await selectVesselType(page);
    await uploadVesselCover(page);

    await page.getByTestId("vessel-publish").click();
    await expect(page).toHaveURL(/\/owner\/sits\/new\?boatId=/);
    const editor = page.getByRole("heading", { name: /Create a boat sit/i });
    await expect(editor).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/Sit Now Cutter/i).first()).toBeVisible();
  });

  test("returns to boats when create sit now is unchecked", async ({ page }) => {
    await seedVerifiedOwner(page);
    await page.goto("/owner/boats/new");
    await expect(page.getByRole("heading", { name: /Add a boat/i })).toBeVisible();

    await page.getByTestId("vessel-create-sit-now-input").uncheck();
    await page.getByLabel(/Boat name/i).fill("Boats Only Skiff");
    await page.getByTestId("vessel-home-port-input").click();
    await page.getByTestId("vessel-home-port-input").fill("Palma");
    await page.getByRole("option", { name: /Palma/i }).first().click();
    await expect(page.getByTestId("vessel-home-port-selected")).toContainText(/Palma/i);
    await selectVesselType(page);
    await uploadVesselCover(page);

    await page.getByTestId("vessel-publish").click();
    await expect(page).toHaveURL(/\/my-boats/);
  });
});
