import { expect, test } from "@playwright/test";
import { seedVerifiedOwner } from "./helpers/auth";

test.describe("member profile shimmer", () => {
  test("shows a detailed profile skeleton while the member loads", async ({ page }) => {
    await seedVerifiedOwner(page);

    let releaseBoat!: () => void;
    const boatGate = new Promise<void>((resolve) => {
      releaseBoat = resolve;
    });

    await page.route("**/api/boats/**", async (route) => {
      await boatGate;
      await route.continue();
    });

    const navigation = page.goto("/members/solstice");
    const skeleton = page.locator('main[aria-busy="true"]');
    await expect(skeleton).toBeVisible({ timeout: 5_000 });
    await expect.poll(async () => skeleton.locator(".shimmer").count()).toBeGreaterThanOrEqual(15);

    releaseBoat();
    await navigation;
    await expect(page.getByRole("heading", { level: 1, name: /Maya|Finn/i })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.locator('main[aria-busy="true"]')).toHaveCount(0);
  });
});
