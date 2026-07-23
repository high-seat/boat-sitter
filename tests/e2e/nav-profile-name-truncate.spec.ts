import { expect, test } from "@playwright/test";
import { seedOwnerSession } from "./helpers/auth";

const LONG_NAME = "Alexandria Maximilienne Constantina Boatstead-Ownerworth the Third";

test.describe("nav profile name truncation", () => {
  test("caps the profile pill width and truncates long names", async ({ page }) => {
    await seedOwnerSession(page, {
      name: LONG_NAME,
      email: "long.name@boatstead.mock",
      verified: true,
    });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await expect(page.getByTestId("nav-profile")).toBeVisible();

    const pill = page.getByTestId("nav-profile");
    const name = page.getByTestId("nav-profile-name");
    await expect(name).toHaveText(LONG_NAME);
    await expect(pill).toHaveAttribute("title", LONG_NAME);

    const metrics = await name.evaluate((element) => {
      const styles = window.getComputedStyle(element);
      return {
        clientWidth: element.clientWidth,
        scrollWidth: element.scrollWidth,
        textOverflow: styles.textOverflow,
        overflow: styles.overflow,
        maxWidth: styles.maxWidth,
      };
    });
    expect(metrics.textOverflow).toBe("ellipsis");
    expect(metrics.overflow).toMatch(/hidden/);
    expect(metrics.scrollWidth).toBeGreaterThan(metrics.clientWidth);

    const pillBox = await pill.boundingBox();
    expect(pillBox).not.toBeNull();
    // max-w-[11.5rem] = 184px, plus a little for borders/shadow measurement variance
    expect(pillBox!.width).toBeLessThanOrEqual(200);
  });

  test("keeps normal-length names fully visible", async ({ page }) => {
    await seedOwnerSession(page, {
      name: "Alx",
      email: "alx.short@boatstead.mock",
      verified: true,
    });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");

    const name = page.getByTestId("nav-profile-name");
    await expect(name).toHaveText("Alx");
    const metrics = await name.evaluate((element) => ({
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
    }));
    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
  });
});
