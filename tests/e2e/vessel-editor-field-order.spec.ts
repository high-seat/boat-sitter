import { expect, test } from "@playwright/test";
import { seedVerifiedOwner } from "./helpers/auth";
import { uploadVesselCover } from "./helpers/images";

test.describe("vessel editor field order", () => {
  test("shows home port and cover before vessel type, with more photos after cover", async ({
    page,
  }) => {
    await seedVerifiedOwner(page);
    await page.goto("/owner/boats/new");
    await expect(page.getByRole("heading", { name: /Add a boat/i })).toBeVisible();

    const order = await page.evaluate(() => {
      const labels = [...document.querySelectorAll(".form-label")].map((el) =>
        (el.textContent ?? "").replace(/\s+/g, " ").trim(),
      );
      const indexIncluding = (needle: string) =>
        labels.findIndex((label) => label.includes(needle));
      return {
        name: indexIncluding("Boat name"),
        homePort: indexIncluding("Home port"),
        cover: indexIncluding("Cover image"),
        type: indexIncluding("Vessel type"),
      };
    });
    expect(order.name).toBeGreaterThanOrEqual(0);
    expect(order.homePort).toBeGreaterThan(order.name);
    expect(order.cover).toBeGreaterThan(order.homePort);
    expect(order.type).toBeGreaterThan(order.cover);

    await expect(page.getByTestId("vessel-add-more-photos")).toHaveCount(0);

    await uploadVesselCover(page);
    const morePhotos = page.getByTestId("vessel-add-more-photos");
    await expect(morePhotos).toBeVisible();
    await expect(morePhotos).toHaveAttribute("aria-expanded", "false");
    await expect(page.getByText(/No additional photos yet/i)).toHaveCount(0);

    await morePhotos.click();
    await expect(morePhotos).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByText(/No additional photos yet/i)).toBeVisible();
  });
});
