import { expect, test } from "@playwright/test";
import { seedVerifiedOwner } from "./helpers/auth";
import { seedDevFixture } from "./helpers/fixtures";

async function cardOrder(section: ReturnType<import("@playwright/test").Page["locator"]>) {
  return section
    .locator('[data-testid^="owner-sit-card-"]')
    .evaluateAll((els) => els.map((el) => el.getAttribute("data-testid")));
}

test.describe("owner sits sort", () => {
  test("sort control lives on accepting applicants and sorts that section only", async ({
    page,
  }) => {
    await seedVerifiedOwner(page);
    await seedDevFixture(page, "reset-solstice-open");
    await seedDevFixture(page, "lifecycle-sit", { phase: "accepting" });
    await seedDevFixture(page, "underway-sit");

    await page.goto("/my-sits");

    const underwaySection = page.getByTestId("owner-sits-phase-stayUnderway");
    const acceptingSection = page.getByTestId("owner-sits-phase-acceptingApplicants");
    const sort = acceptingSection.getByTestId("owner-sits-sort");

    await expect(underwaySection).toBeVisible();
    await expect(acceptingSection).toBeVisible();
    await expect(sort).toBeVisible();
    await expect(sort).toHaveValue("soonest");
    await expect(underwaySection.getByTestId("owner-sits-sort")).toHaveCount(0);
    await expect(page.getByTestId("owner-sits-sort")).toHaveCount(1);

    await expect(acceptingSection.getByTestId("owner-sit-card-sit-lifecycle-e2e")).toBeVisible();
    await expect(acceptingSection.getByTestId("owner-sit-card-solstice")).toBeVisible();
    await expect(acceptingSection.getByTestId("owner-sit-card-image-solstice")).toBeVisible();

    const underwayBefore = await cardOrder(underwaySection);

    // Lifecycle sit starts ~45 days out; Solstice starts later (Sep 12).
    let order = await cardOrder(acceptingSection);
    expect(order.indexOf("owner-sit-card-sit-lifecycle-e2e")).toBeGreaterThanOrEqual(0);
    expect(order.indexOf("owner-sit-card-solstice")).toBeGreaterThanOrEqual(0);
    expect(order.indexOf("owner-sit-card-sit-lifecycle-e2e")).toBeLessThan(
      order.indexOf("owner-sit-card-solstice"),
    );

    const latestResponse = page.waitForResponse(
      (response) =>
        response.url().includes("/api/sits") &&
        response.url().includes("sort=latest") &&
        response.ok(),
    );
    await sort.selectOption("latest");
    await latestResponse;

    await expect
      .poll(async () => {
        order = await cardOrder(acceptingSection);
        return (
          order.indexOf("owner-sit-card-solstice") <
          order.indexOf("owner-sit-card-sit-lifecycle-e2e")
        );
      })
      .toBe(true);

    await expect.poll(async () => cardOrder(underwaySection)).toEqual(underwayBefore);

    const mostApplicantsResponse = page.waitForResponse(
      (response) =>
        response.url().includes("/api/sits") &&
        response.url().includes("sort=mostApplicants") &&
        response.ok(),
    );
    await sort.selectOption("mostApplicants");
    await mostApplicantsResponse;
    await expect(sort).toHaveValue("mostApplicants");

    await expect(sort.locator("option")).toHaveCount(3);
    await expect(sort.locator('option[value="awaitingApplicants"]')).toHaveCount(0);
  });

  test("dims results while sorting and shows overlay after a delay", async ({ page }) => {
    await seedVerifiedOwner(page);
    await seedDevFixture(page, "reset-solstice-open");
    await seedDevFixture(page, "lifecycle-sit", { phase: "accepting" });
    await page.goto("/my-sits");

    const sort = page.getByTestId("owner-sits-sort");
    const results = page.getByTestId("owner-sits-results");
    await expect(results).toBeVisible();
    await expect(results).not.toHaveAttribute("data-pending", "true");

    await page.route("**/api/sits**", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2500));
      await route.continue();
    });

    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/api/sits") &&
        response.url().includes("sort=latest") &&
        response.ok(),
    );
    await sort.selectOption("latest");

    await expect(results).toHaveAttribute("data-pending", "true", { timeout: 1000 });
    await page.screenshot({
      path: ".artifacts/playwright/owner-sits-sort-dimmed.png",
      scale: "css",
      type: "png",
    });
    await expect(page.getByTestId("owner-sits-results-overlay")).toBeVisible({ timeout: 3000 });
    await page.screenshot({
      path: ".artifacts/playwright/owner-sits-sort-overlay.png",
      scale: "css",
      type: "png",
    });
    await expect(page.getByTestId("owner-sits-results-overlay")).toContainText(/Sorting sits/i);

    await responsePromise;
    await expect(results).not.toHaveAttribute("data-pending", "true", { timeout: 5000 });
    await expect(page.getByTestId("owner-sits-results-overlay")).toHaveCount(0);
  });
});
