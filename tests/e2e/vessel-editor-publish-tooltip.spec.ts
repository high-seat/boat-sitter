import { expect, test } from "@playwright/test";
import { seedVerifiedOwner } from "./helpers/auth";
import { uploadVesselCover } from "./helpers/images";
import {
  fillVesselAboutFields,
  pickVesselPortAddress,
  selectVesselType,
} from "./helpers/vesselEditor";

test.describe("vessel editor publish blocked tooltip", () => {
  test("shows which required fields are missing when publish is disabled", async ({ page }) => {
    await seedVerifiedOwner(page);
    await page.goto("/owner/boats/new");
    await expect(page.getByRole("heading", { name: /Add a boat/i })).toBeVisible();

    const publish = page.getByTestId("vessel-publish");
    await expect(publish).toBeDisabled();
    await expect(publish).not.toHaveAttribute("title");
    await expect(page.getByTestId("vessel-type")).toHaveValue("Not specified");

    await publish.hover({ force: true });
    await expect(
      page.getByRole("tooltip", {
        name: /Still needed:.*Cover image.*Boat name.*Normal port address.*Public city and country.*Vessel type.*About the boat.*Life aboard/i,
      }),
    ).toBeVisible();

    await uploadVesselCover(page);
    await publish.hover({ force: true });
    await expect(
      page.getByRole("tooltip", {
        name: /Still needed:.*Boat name.*Normal port address.*Public city and country.*Vessel type.*About the boat.*Life aboard/i,
      }),
    ).toBeVisible();
    await expect(page.getByRole("tooltip", { name: /Cover image/i })).toHaveCount(0);
    await expect(publish).not.toHaveAttribute("title");

    await page.getByLabel(/Boat name/i).fill("Tooltip Test");
    await publish.hover({ force: true });
    await expect(
      page.getByRole("tooltip", {
        name: /Still needed:.*Normal port address.*Public city and country.*Vessel type.*About the boat.*Life aboard/i,
      }),
    ).toBeVisible();
    await expect(page.getByRole("tooltip", { name: /Boat name/i })).toHaveCount(0);

    await pickVesselPortAddress(page);
    await publish.hover({ force: true });
    await expect(
      page.getByRole("tooltip", {
        name: /Still needed:.*Vessel type.*About the boat.*Life aboard/i,
      }),
    ).toBeVisible();
    await expect(page.getByRole("tooltip", { name: /Normal port address/i })).toHaveCount(0);
    await expect(publish).toBeDisabled();

    await selectVesselType(page);
    await publish.hover({ force: true });
    await expect(
      page.getByRole("tooltip", { name: /Still needed:.*About the boat.*Life aboard/i }),
    ).toBeVisible();
    await expect(page.getByRole("tooltip", { name: /Vessel type/i })).toHaveCount(0);
    await expect(publish).toBeDisabled();

    await fillVesselAboutFields(page);
    await expect(publish).toBeEnabled();
    await expect(publish).not.toHaveAttribute("title");
    await publish.hover();
    await expect(page.getByRole("tooltip", { name: /Still needed/i })).toHaveCount(0);
  });
});
