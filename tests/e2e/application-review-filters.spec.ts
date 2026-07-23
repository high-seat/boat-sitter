import { expect, test } from "@playwright/test";
import { seedVerifiedOwner } from "./helpers/auth";

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

    await status.selectOption("declined");
    await expect(page.getByText(/Showing [1-9]\d* of [1-9]\d*/i)).toBeVisible();

    await experience.selectOption("any");
    await expect(page.getByText(/Showing [1-9]\d* of [1-9]\d*/i)).toBeVisible();

    await status.selectOption("all");
    await sort.selectOption("newest");
    await expect(page.getByText(before)).toBeVisible();
  });

  test("paginates when more applications than the page size", async ({ page }) => {
    await seedVerifiedOwner(page);
    await page.addInitScript(() => {
      const extras = Array.from({ length: 22 }, (_, index) => {
        const n = index + 1;
        return {
          id: `application-solstice-page-${n}`,
          sitId: "solstice",
          boatName: "Solstice",
          ownerName: "Maya & Finn",
          status: "new",
          createdAt: `2026-03-${String((n % 28) + 1).padStart(2, "0")}T12:00:00.000Z`,
          partySize: 1,
          applicant: {
            name: `Pager Sitter ${n}`,
            image: `https://i.pravatar.cc/160?img=${(n % 70) + 1}`,
            location: "Athens, Greece",
            bio: "Pagination test sitter",
            languages: ["English"],
            preferredCountries: ["Greece"],
            skills: [],
            yearsExperience: n,
            certifications: [],
            memberSince: 2020,
            completedSits: n,
          },
          messages: [
            {
              id: `message-solstice-page-${n}`,
              senderName: `Pager Sitter ${n}`,
              text: "Hello from the pagination suite.",
              createdAt: `2026-03-${String((n % 28) + 1).padStart(2, "0")}T12:05:00.000Z`,
            },
          ],
        };
      });
      localStorage.setItem("boatstead-applications-v3", "complete");
      localStorage.setItem("harbourly-applications", JSON.stringify(extras));
    });

    await page.goto("/owner/sits/solstice/applications");
    await expect(page.getByRole("heading", { name: /Applications for/i })).toBeVisible();
    await expect(page.getByText(/Showing 20 of \d+/i)).toBeVisible();
    await expect(page.getByRole("navigation", { name: /pagination/i })).toBeVisible();
    await page.getByRole("button", { name: /Next/i }).click();
    await expect(page.getByText(/Showing \d+ of \d+/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /Pager Sitter/i }).first()).toBeVisible();
  });
});
