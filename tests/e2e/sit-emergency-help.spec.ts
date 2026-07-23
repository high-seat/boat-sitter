import { expect, test } from "@playwright/test";
import { seedOwnerSession, seedVerifiedOwner } from "./helpers/auth";
import { seedDevFixture, seedLifecycleSit } from "./helpers/fixtures";

test.describe("sit emergency help during underway", () => {
  test("owner can open emergency guidance from My sits", async ({ page }) => {
    await seedVerifiedOwner(page);
    await seedDevFixture(page, "underway-sit");

    await page.goto("/my-sits");
    await expect(page.getByTestId("sit-emergency-help").first()).toBeVisible();
    await page.getByTestId("sit-emergency-help").first().click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("heading", { name: /In an emergency/i })).toBeVisible();
    await expect(dialog.getByText(/call local emergency services/i)).toBeVisible();
    await expect(dialog.getByText(/^Police$/i)).toBeVisible();
    await expect(dialog.getByText(/^Ambulance$/i)).toBeVisible();
    await dialog.getByRole("button", { name: /Got it/i }).click();
    await expect(dialog).toHaveCount(0);
  });

  test("sitter can open emergency guidance from My sits", async ({ page, browser }) => {
    const mayaContext = await browser.newContext();
    const mayaPage = await mayaContext.newPage();
    await seedVerifiedOwner(mayaPage);
    await seedDevFixture(mayaPage, "underway-sit");
    await mayaContext.close();

    await seedOwnerSession(page, {
      name: "Alex Morgan",
      email: "alex.morgan@boatstead.mock",
      image: "https://i.pravatar.cc/160?img=11",
      phoneNumber: "7700900123",
    });

    await page.goto("/my-sits");
    await expect(page.getByTestId("sit-emergency-help").first()).toBeVisible();
    await page.getByTestId("sit-emergency-help").first().click();
    await expect(
      page.getByRole("dialog").getByRole("heading", { name: /In an emergency/i }),
    ).toBeVisible();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: /Got it/i })
      .click();

    // Messages chat chrome stays free of Emergency; My sits owns that CTA.
    await page.goto("/messages?application=application-underway-emergency-e2e");
    await expect(page.getByTestId("conversation-messages")).toBeVisible();
    await expect(page.getByTestId("sit-emergency-help")).toHaveCount(0);
  });

  test("does not show Emergency in chat for a non-confirmed applicant", async ({ page }) => {
    await seedVerifiedOwner(page);
    await seedLifecycleSit(page, "underway");

    await page.goto("/messages?application=application-lifecycle-prior-e2e");
    await expect(page.getByTestId("conversation-messages")).toBeVisible();
    await expect(page.getByTestId("sit-emergency-help")).toHaveCount(0);
  });
});
