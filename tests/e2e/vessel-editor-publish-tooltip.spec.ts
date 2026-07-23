import { expect, test } from "@playwright/test";
import { seedVerifiedOwner } from "./helpers/auth";

test.describe("vessel editor publish blocked tooltip", () => {
  test("shows which required fields are missing when publish is disabled", async ({ page }) => {
    await seedVerifiedOwner(page);
    await page.goto("/owner/boats/new");
    await expect(page.getByRole("heading", { name: /Add a boat/i })).toBeVisible();

    const publish = page.getByTestId("vessel-publish");
    await expect(publish).toBeDisabled();
    await expect(publish).not.toHaveAttribute("title");

    await publish.hover({ force: true });
    await expect(
      page.getByRole("tooltip", { name: /Still needed:.*Boat name.*Home port/i }),
    ).toBeVisible();

    await page.getByLabel(/Boat name/i).fill("Tooltip Test");
    await publish.hover({ force: true });
    await expect(page.getByRole("tooltip", { name: /Still needed:.*Home port/i })).toBeVisible();
    await expect(page.getByRole("tooltip", { name: /Boat name/i })).toHaveCount(0);
    await expect(publish).not.toHaveAttribute("title");

    await page.getByTestId("vessel-home-port-input").click();
    await page.getByTestId("vessel-home-port-input").fill("Lefk");
    await page
      .getByRole("option", { name: /Lefkada/i })
      .first()
      .click();
    await expect(page.getByTestId("vessel-home-port-selected")).toContainText(/Lefkada/i);
    await expect(publish).toBeEnabled();
    await expect(publish).not.toHaveAttribute("title");
    await publish.hover();
    await expect(page.getByRole("tooltip", { name: /Still needed/i })).toHaveCount(0);
  });
});
