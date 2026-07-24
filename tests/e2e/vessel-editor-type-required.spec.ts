import { expect, test } from "@playwright/test";
import { seedVerifiedOwner } from "./helpers/auth";
import { uploadVesselCover } from "./helpers/images";
import {
  fillVesselAboutFields,
  pickVesselPortAddress,
  selectVesselType,
} from "./helpers/vesselEditor";

test.describe("vessel editor type required", () => {
  test("defaults to not specified and blocks publish until a type is chosen", async ({ page }) => {
    await seedVerifiedOwner(page);
    await page.goto("/owner/boats/new");
    await expect(page.getByRole("heading", { name: /Add a boat/i })).toBeVisible();

    const type = page.getByTestId("vessel-type");
    await expect(type).toHaveValue("Not specified");
    await expect(
      page.getByTestId("form-label-required").filter({ hasText: /Vessel type/i }),
    ).toBeVisible();

    await page.getByLabel(/Boat name/i).fill("Type Required");
    await pickVesselPortAddress(page);
    await uploadVesselCover(page);
    await fillVesselAboutFields(page);

    const publish = page.getByTestId("vessel-publish");
    await expect(publish).toBeDisabled();
    await publish.hover({ force: true });
    await expect(page.getByRole("tooltip", { name: /Vessel type/i })).toBeVisible();

    await selectVesselType(page, "Catamaran");
    await expect(type).toHaveValue("Catamaran");
    await expect(publish).toBeEnabled();
  });
});
