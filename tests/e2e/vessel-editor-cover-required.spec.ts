import { expect, test } from "@playwright/test";
import { seedVerifiedOwner } from "./helpers/auth";
import { uploadVesselCover } from "./helpers/images";
import { selectVesselType } from "./helpers/vesselEditor";

test.describe("vessel editor cover required", () => {
  test("requires a cover photo and hides more photos until one is chosen", async ({ page }) => {
    await seedVerifiedOwner(page);
    await page.goto("/owner/boats/new");
    await expect(page.getByRole("heading", { name: /Add a boat/i })).toBeVisible();

    await expect(
      page.getByTestId("form-label-required").filter({ hasText: /Cover image/i }),
    ).toBeVisible();
    await expect(page.getByTestId("vessel-add-more-photos")).toHaveCount(0);

    const publish = page.getByTestId("vessel-publish");
    await page.getByLabel(/Boat name/i).fill("Cover Required");
    await page.getByTestId("vessel-home-port-input").click();
    await page.getByTestId("vessel-home-port-input").fill("Lefk");
    await page
      .getByRole("option", { name: /Lefkada/i })
      .first()
      .click();
    await expect(page.getByTestId("vessel-home-port-selected")).toContainText(/Lefkada/i);
    await selectVesselType(page);

    await expect(publish).toBeDisabled();
    await publish.hover({ force: true });
    await expect(page.getByRole("tooltip", { name: /Cover image/i })).toBeVisible();

    await uploadVesselCover(page);
    await expect(page.getByTestId("vessel-add-more-photos")).toBeVisible();
    await expect(page.getByTestId("vessel-cover-remove")).toContainText(/Remove photo/i);
    await expect(page.getByTestId("vessel-add-more-photos")).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    await expect(publish).toBeEnabled();

    await page.getByTestId("vessel-cover-remove").click();
    await expect(page.getByTestId("vessel-cover-preview")).toHaveCount(0);
    await expect(page.getByTestId("vessel-add-more-photos")).toHaveCount(0);
    await expect(publish).toBeDisabled();
  });
});
