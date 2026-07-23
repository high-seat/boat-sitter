import { expect, test } from "@playwright/test";
import { seedVerifiedOwner } from "./helpers/auth";
import { seedDevFixture } from "./helpers/fixtures";

test.describe("application review filters", () => {
  test("sort and status filters update the list from the server query", async ({ page }) => {
    await seedVerifiedOwner(page);
    await page.goto("/owner/sits/solstice/applications");
    await expect(page.getByRole("heading", { name: /Applications for/i })).toBeVisible();

    const sort = page.getByTestId("application-sort");
    const filtersToggle = page.getByTestId("application-filters-toggle");
    const count = page.getByTestId("application-filtered-count");

    await expect(count).toBeVisible();
    const before = await count.innerText();
    expect(before).not.toMatch(/Showing 0 of 0/i);

    await sort.selectOption("priorSits");
    await expect(page.getByRole("heading", { name: /Applications for/i })).toBeVisible();
    await expect(count).toBeVisible();

    await expect(page.getByTestId("application-list-filters")).toHaveCount(0);
    await filtersToggle.click();
    await expect(page.getByTestId("application-list-filters")).toBeVisible();

    const status = page.getByTestId("application-filter-status");
    const experience = page.getByTestId("application-filter-experience");

    await status.selectOption("shortlisted");
    await expect(count).toHaveText(/Showing [1-9]\d* of [1-9]\d*/i);
    await expect(filtersToggle).toHaveText(/Filters \(1\)/i);

    await experience.selectOption("any");
    await expect(count).toHaveText(/Showing [1-9]\d* of [1-9]\d*/i);

    await status.selectOption("all");
    await sort.selectOption("newest");
    await expect(filtersToggle).toHaveText(/^Filters$/i);
    await expect(count).toHaveText(before);

    await filtersToggle.click();
    await expect(page.getByTestId("application-list-filters")).toHaveCount(0);
  });

  test("paginates when more applications than the page size", async ({ page }) => {
    await seedVerifiedOwner(page);
    await seedDevFixture(page, "paginated-applications");

    await page.goto("/owner/sits/solstice/applications");
    await expect(page.getByRole("heading", { name: /Applications for/i })).toBeVisible();
    await expect(page.getByTestId("application-filtered-count")).toHaveText(/Showing 5 of \d+/i);
    await expect(page.getByTestId("results-pagination")).toBeVisible();
    await expect(page.getByTestId("results-pagination-range")).toHaveText(/Showing 1 to 5 of \d+/i);
    await page.getByTestId("results-pagination-next").click();
    await expect(page.getByTestId("application-filtered-count")).toBeVisible();
    await expect(page.getByTestId("results-pagination-range")).toHaveText(
      /Showing 6 to 10 of \d+/i,
    );
    await expect(page.getByRole("button", { name: /Pager Sitter/i }).first()).toBeVisible();
  });
});
