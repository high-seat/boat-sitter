import { expect, test } from "@playwright/test";
import { seedVerifiedOwner } from "./helpers/auth";

test.describe("vessel editor live preview", () => {
  test("shows a live boat preview that updates with the name", async ({ page }) => {
    await seedVerifiedOwner(page);
    await page.goto("/owner/boats/new");
    await expect(page.getByRole("heading", { name: /Add a boat/i })).toBeVisible();

    const preview = page.getByRole("complementary", { name: /Live preview/i });
    await expect(preview).toBeVisible();
    await expect(preview.getByRole("heading", { name: /How it will look/i })).toBeVisible();
    await expect(preview.getByText(/^Live preview$/i)).toHaveCount(0);
    await expect(preview.getByTestId("vessel-preview-name")).toHaveText(/Untitled boat/i);
    await expect(preview.getByTestId("vessel-preview-location")).toHaveText(/Location unknown/i);

    await page.getByPlaceholder(/e\.g\. Solstice/i).fill("Preview Wind");
    await expect(preview.getByTestId("vessel-preview-name")).toHaveText("Preview Wind");

    await page.getByTestId("vessel-home-port-input").click();
    await page.getByTestId("vessel-home-port-input").fill("Antib");
    await page
      .getByRole("option", { name: /Antibes/i })
      .first()
      .click();
    await expect(preview.getByTestId("vessel-preview-location")).toContainText(/Antibes/i);
    await expect(preview.getByTestId("vessel-preview-location")).not.toHaveText(
      /Location unknown/i,
    );
  });

  test("truncates an oversized boat name in the live preview", async ({ page }) => {
    await seedVerifiedOwner(page);
    await page.goto("/owner/boats/new");

    const longName = "A".repeat(100);
    await page.getByPlaceholder(/e\.g\. Solstice/i).fill(longName);

    const previewName = page.getByTestId("vessel-preview-name");
    await expect(previewName).toHaveText(longName);
    await expect(previewName).toHaveCSS("text-overflow", "ellipsis");
    await expect
      .poll(async () => previewName.evaluate((el) => el.scrollWidth > el.clientWidth))
      .toBe(true);
  });
});
