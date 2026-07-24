import { expect, test } from "@playwright/test";
import { seedVerifiedOwner } from "./helpers/auth";
import { seedDevFixture } from "./helpers/fixtures";

test.describe("boat access details", () => {
  test("copies row values and links the address to Google Maps", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await seedVerifiedOwner(page);
    await seedDevFixture(page, "reset-solstice-open");
    await page.goto("/boats/solstice");

    const access = page.getByTestId("boat-access-details");
    await expect(access).toBeVisible();

    const address = "Berth B12, Lefkas Marina, Lefkada 311 00, Greece";
    const mapsLink = access.getByRole("link", { name: new RegExp(address) });
    await expect(mapsLink).toHaveAttribute(
      "href",
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`,
    );

    await access.getByRole("button", { name: /Copy Wi-Fi network/i }).click();
    await expect(access.getByRole("button", { name: /^Copied$/i })).toBeVisible();
    await expect
      .poll(async () => page.evaluate(() => navigator.clipboard.readText()))
      .toBe("Solstice-Guest");

    await access.getByRole("button", { name: /Copy Wi-Fi password/i }).click();
    await expect
      .poll(async () => page.evaluate(() => navigator.clipboard.readText()))
      .toBe("aegean-sun-42");
  });
});
