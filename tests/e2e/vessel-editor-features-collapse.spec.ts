import { expect, test } from "@playwright/test";
import { seedVerifiedOwner } from "./helpers/auth";

test.describe("vessel editor features collapse", () => {
  test("shows two rows of amenities with a more badge that expands", async ({ page }) => {
    await seedVerifiedOwner(page);
    await page.goto("/owner/boats/new");
    await expect(page.getByRole("heading", { name: /Add a boat/i })).toBeVisible();

    const lifeAboard = page.getByTestId("vessel-feature-group-life-aboard");

    await expect(lifeAboard.getByRole("button", { name: "Wi-Fi", exact: true })).toBeVisible();
    await expect(lifeAboard.getByRole("button", { name: "Bathroom", exact: true })).toBeVisible();
    await expect(lifeAboard.getByRole("button", { name: "Hot water", exact: true })).toBeVisible();
    await expect(
      lifeAboard.getByRole("button", { name: "Full kitchen", exact: true }),
    ).toBeVisible();
    await expect(
      lifeAboard.getByRole("button", { name: "Refrigerator", exact: true }),
    ).toBeVisible();
    await expect(lifeAboard.getByRole("button", { name: "Outdoor BBQ", exact: true })).toHaveCount(
      0,
    );

    const more = lifeAboard.getByTestId("vessel-feature-group-more");
    await expect(more).toBeVisible();
    await expect(more).toHaveAttribute("aria-expanded", "false");

    await more.click();
    await expect(
      lifeAboard.getByRole("button", { name: "Outdoor BBQ", exact: true }),
    ).toBeVisible();
    await expect(lifeAboard.getByTestId("vessel-feature-group-show-less")).toBeVisible();

    await lifeAboard.getByTestId("vessel-feature-group-show-less").click();
    await expect(lifeAboard.getByRole("button", { name: "Outdoor BBQ", exact: true })).toHaveCount(
      0,
    );
    await expect(lifeAboard.getByTestId("vessel-feature-group-more")).toBeVisible();
  });

  test("security group with five amenities has no more badge", async ({ page }) => {
    await seedVerifiedOwner(page);
    await page.goto("/owner/boats/new");

    const security = page.getByTestId("vessel-feature-group-security-access");

    await expect(security.getByRole("button", { name: "Gated access", exact: true })).toBeVisible();
    await expect(
      security.getByRole("button", { name: "Night lighting", exact: true }),
    ).toBeVisible();
    await expect(security.getByTestId("vessel-feature-group-more")).toHaveCount(0);
  });

  test("includes snorkel gear under water and recreation", async ({ page }) => {
    await seedVerifiedOwner(page);
    await page.goto("/owner/boats/new");

    const water = page.getByTestId("vessel-feature-group-water-recreation");
    await expect(water.getByRole("button", { name: "Snorkel gear", exact: true })).toBeVisible();
    await expect(water.getByRole("button", { name: "Tender", exact: true })).toBeVisible();
    await expect(water.getByTestId("vessel-feature-group-more")).toBeVisible();
    await water.getByTestId("vessel-feature-group-more").click();
    await expect(water.getByRole("button", { name: "Bicycles", exact: true })).toBeVisible();
  });

  test("does not offer on-site bathrooms and showers amenity", async ({ page }) => {
    await seedVerifiedOwner(page);
    await page.goto("/owner/boats/new");

    const marina = page.getByTestId("vessel-feature-group-marina-facilities");
    await marina.getByTestId("vessel-feature-group-more").click();
    await expect(marina.getByRole("button", { name: /On-site bathrooms & showers/i })).toHaveCount(
      0,
    );
    await expect(marina.getByRole("button", { name: "Showers", exact: true })).toBeVisible();
    await expect(marina.getByRole("button", { name: "Laundry", exact: true })).toBeVisible();
    await expect(marina.getByRole("button", { name: "Restaurant", exact: true })).toBeVisible();
    await expect(marina.getByRole("button", { name: /On-site laundry/i })).toHaveCount(0);
    await expect(marina.getByRole("button", { name: /On-site restaurant/i })).toHaveCount(0);
  });
});
