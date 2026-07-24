import { expect, test } from "@playwright/test";
import { seedVerifiedOwner } from "./helpers/auth";
import { seedDevFixture } from "./helpers/fixtures";

test.describe("owner sits phase sections", () => {
  test("groups owned sits by phase with underway first", async ({ page }) => {
    await seedVerifiedOwner(page);
    await seedDevFixture(page, "underway-sit");
    await seedDevFixture(page, "lifecycle-sit", { phase: "accepted" });
    await seedDevFixture(page, "reset-solstice-open");

    await page.goto("/my-sits");

    const underway = page.getByTestId("owner-sits-phase-stayUnderway");
    const accepted = page.getByTestId("owner-sits-phase-applicantChosen");
    const accepting = page.getByTestId("owner-sits-phase-acceptingApplicants");

    await expect(underway).toBeVisible();
    await expect(accepted).toBeVisible();
    await expect(accepting).toBeVisible();

    await expect(underway.getByRole("heading", { name: /^Sit underway$/i })).toBeVisible();
    await expect(accepted.getByRole("heading", { name: /^Applicant accepted$/i })).toBeVisible();
    await expect(accepting.getByRole("heading", { name: /^Accepting applicants$/i })).toBeVisible();

    const order = await page
      .locator('[data-testid^="owner-sits-phase-"]')
      .evaluateAll((els) => els.map((el) => el.getAttribute("data-testid")));

    expect(order.indexOf("owner-sits-phase-stayUnderway")).toBeGreaterThanOrEqual(0);
    expect(order.indexOf("owner-sits-phase-applicantChosen")).toBeGreaterThanOrEqual(0);
    expect(order.indexOf("owner-sits-phase-acceptingApplicants")).toBeGreaterThanOrEqual(0);
    expect(order.indexOf("owner-sits-phase-stayUnderway")).toBeLessThan(
      order.indexOf("owner-sits-phase-applicantChosen"),
    );
    expect(order.indexOf("owner-sits-phase-applicantChosen")).toBeLessThan(
      order.indexOf("owner-sits-phase-acceptingApplicants"),
    );
  });

  test("dashboard phase matches applications page for an underway sit", async ({ page }) => {
    await seedVerifiedOwner(page);
    await seedDevFixture(page, "underway-sit");

    await page.goto("/my-sits");
    const card = page.getByTestId("owner-sit-card-sit-underway-emergency-e2e");
    await expect(
      page
        .getByTestId("owner-sits-phase-stayUnderway")
        .getByTestId("owner-sit-card-sit-underway-emergency-e2e"),
    ).toBeVisible();
    await expect(
      page
        .getByTestId("owner-sits-phase-acceptingApplicants")
        .getByTestId("owner-sit-card-sit-underway-emergency-e2e"),
    ).toHaveCount(0);

    await card.getByTestId("owner-sit-manage").click();
    await expect(page).toHaveURL(/\/owner\/sits\/sit-underway-emergency-e2e\/applications/);
    await expect(page.getByTestId("sit-phase-step-stayUnderway")).toHaveAttribute(
      "data-current",
      "true",
    );
    await expect(page.getByTestId("sit-phase-step-acceptingApplicants")).not.toHaveAttribute(
      "data-current",
      "true",
    );
  });

  test("empty phase filter shows a show-all-sits button", async ({ page }) => {
    await seedVerifiedOwner(page);
    await seedDevFixture(page, "reset-solstice-open");

    await page.goto("/my-sits");

    await expect(page.getByTestId("owner-sit-card-solstice")).toBeVisible();
    await page.getByTestId("owner-sits-phase-filter").selectOption("stayCompleted");

    const empty = page.getByTestId("owner-sits-phase-empty");
    await expect(empty).toBeVisible();
    await expect(empty.getByTestId("owner-sits-show-all")).toHaveText(/Show all sits/i);

    await empty.getByTestId("owner-sits-show-all").click();

    await expect(page.getByTestId("owner-sits-phase-empty")).toHaveCount(0);
    await expect(page.getByTestId("owner-sit-card-solstice")).toBeVisible();
    await expect(page.getByTestId("owner-sits-phase-filter")).toHaveValue("all");
  });
});
