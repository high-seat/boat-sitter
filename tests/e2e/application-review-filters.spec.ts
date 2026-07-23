import { expect, test } from "@playwright/test";
import { seedVerifiedOwner } from "./helpers/auth";
import { seedDevFixture } from "./helpers/fixtures";

test.describe("application review filters", () => {
  test("sort and status filters update the list from the server query", async ({ page }) => {
    await seedVerifiedOwner(page);
    await page.goto("/owner/sits/solstice/applications");
    await expect(page.getByRole("heading", { name: /Applications for/i })).toBeVisible();

    const sort = page.getByLabel(/Sort applications/i);
    const status = page.getByLabel(/Filter by status/i);
    const experience = page.getByLabel(/Filter by experience/i);
    const count = page.getByText(/Showing \d+ of \d+/i);

    await expect(count).toBeVisible();
    const before = await count.innerText();
    expect(before).not.toMatch(/Showing 0 of 0/i);

    await sort.selectOption("priorSits");
    await expect(page.getByRole("heading", { name: /Applications for/i })).toBeVisible();
    await expect(count).toBeVisible();

    await status.selectOption("shortlisted");
    await expect(page.getByText(/Showing [1-9]\d* of [1-9]\d*/i)).toBeVisible();

    await experience.selectOption("any");
    await expect(page.getByText(/Showing [1-9]\d* of [1-9]\d*/i)).toBeVisible();

    await status.selectOption("all");
    await sort.selectOption("newest");
    await expect(page.getByText(before)).toBeVisible();
  });

  test("paginates when more applications than the page size", async ({ page }) => {
    await seedVerifiedOwner(page);
    await seedDevFixture(page, "paginated-applications");

    await page.goto("/owner/sits/solstice/applications");
    await expect(page.getByRole("heading", { name: /Applications for/i })).toBeVisible();
    await expect(page.getByText(/Showing 20 of \d+/i)).toBeVisible();
    await expect(page.getByRole("navigation", { name: /pagination/i })).toBeVisible();
    await page.getByRole("button", { name: /Next/i }).click();
    await expect(page.getByText(/Showing \d+ of \d+/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /Pager Sitter/i }).first()).toBeVisible();
  });
});
