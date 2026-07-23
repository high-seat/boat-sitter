import { expect, test } from "@playwright/test";

test.describe("boats map view", () => {
  test("deeplinks with view=map and loads markers progressively", async ({ page }) => {
    await page.goto("/boats?view=map");
    await expect(page.getByRole("button", { name: /^Map$/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(page).toHaveURL(/view=map/);

    await expect(page.getByRole("region", { name: /Boat sit search map/i })).toBeVisible({
      timeout: 15000,
    });
    // First page paints quickly; progress text appears while later pages load.
    await expect
      .poll(async () => {
        const progress = await page.getByText(/Loaded \d+ of \d+ sits onto the map/i).count();
        const markersReady = await page.getByRole("region", { name: /Boat sit search map/i }).count();
        return progress > 0 || markersReady > 0;
      })
      .toBeTruthy();

    await page.getByRole("button", { name: /^List$/i }).click();
    await expect(page).not.toHaveURL(/view=map/);
    await expect(page.getByRole("button", { name: /^List$/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  test("switching to map updates the URL", async ({ page }) => {
    await page.goto("/boats");
    await expect(page.getByRole("button", { name: /^Map$/i })).toBeEnabled();
    await page.getByRole("button", { name: /^Map$/i }).click();
    await expect(page).toHaveURL(/view=map/);
    await expect(page.getByRole("button", { name: /^Map$/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});
