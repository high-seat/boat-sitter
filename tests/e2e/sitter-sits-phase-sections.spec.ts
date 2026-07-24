import { expect, test } from "@playwright/test";
import { seedOwnerSession, seedVerifiedOwner } from "./helpers/auth";
import { seedDevFixture } from "./helpers/fixtures";

test.describe("sitter sits phase sections", () => {
  test("groups requested sits by phase with underway first", async ({ page, browser }) => {
    const ownerContext = await browser.newContext();
    const ownerPage = await ownerContext.newPage();
    await seedVerifiedOwner(ownerPage);
    await seedDevFixture(ownerPage, "underway-sit");
    await seedDevFixture(ownerPage, "lifecycle-sit", { phase: "accepting" });
    await ownerContext.close();

    await seedOwnerSession(page, {
      name: "Alex Morgan",
      email: "alex.morgan@boatstead.mock",
      image: "https://i.pravatar.cc/160?img=11",
      phoneNumber: "7700900123",
      verified: true,
    });

    await page.goto("/my-sits");

    const underway = page.getByTestId("sitter-sits-phase-stayUnderway");
    const accepting = page.getByTestId("sitter-sits-phase-acceptingApplicants");

    await expect(underway).toBeVisible();
    await expect(accepting).toBeVisible();
    await expect(underway.getByRole("heading", { name: /^Sit underway$/i })).toBeVisible();
    await expect(accepting.getByRole("heading", { name: /^Accepting applicants$/i })).toBeVisible();

    await expect(underway.getByTestId("sitter-sit-card-sit-underway-emergency-e2e")).toBeVisible();
    await expect(accepting.getByTestId("sitter-sit-card-sit-lifecycle-e2e")).toBeVisible();

    // Accepted sits are unpublished — no public listing link.
    await expect(
      underway.getByTestId("sitter-sit-view-listing-sit-underway-emergency-e2e"),
    ).toHaveCount(0);
    await expect(accepting.getByTestId("sitter-sit-view-listing-sit-lifecycle-e2e")).toBeVisible();

    await expect(
      underway.getByTestId("sitter-sit-withdraw-sit-underway-emergency-e2e"),
    ).toHaveCount(0);
    await expect(accepting.getByTestId("sitter-sit-withdraw-sit-lifecycle-e2e")).toBeVisible();

    const order = await page
      .locator('[data-testid^="sitter-sits-phase-"]')
      .evaluateAll((els) => els.map((el) => el.getAttribute("data-testid")));
    expect(order.indexOf("sitter-sits-phase-stayUnderway")).toBeGreaterThanOrEqual(0);
    expect(order.indexOf("sitter-sits-phase-acceptingApplicants")).toBeGreaterThanOrEqual(0);
    expect(order.indexOf("sitter-sits-phase-stayUnderway")).toBeLessThan(
      order.indexOf("sitter-sits-phase-acceptingApplicants"),
    );
  });
});
