import { expect, test } from "@playwright/test";
import { seedOwnerSession } from "./helpers/auth";

test.describe("find a sitter", () => {
  test("shows sitter catalogue with filters and profile links", async ({ page }) => {
    await page.goto("/sitters");
    await expect(page.getByTestId("sitters-title")).toBeVisible();
    await expect(page.getByTestId("sitters-filters")).toBeVisible();
    await expect(page.getByTestId("sitters-results-count")).toBeVisible();
    await expect(page.getByTestId("sitter-card").first()).toBeVisible();

    const firstCard = page.getByTestId("sitter-card").first();
    const name = await firstCard.getByTestId("sitter-card-name").innerText();
    await firstCard.click();
    await expect(page).toHaveURL(new RegExp(`/members/${encodeURIComponent(name)}`));
  });

  test("shows Matches badge when sitter availability overlaps an owner sit", async ({ page }) => {
    await seedOwnerSession(page, {
      name: "Maya & Finn",
      email: "maya.finn@boatstead.mock",
      image: "https://i.pravatar.cc/160?img=5",
      phoneNumber: "6912345678",
      verified: true,
    });

    await page.goto("/sitters");
    await expect(page.getByTestId("sitters-results")).toBeVisible();
    const matchedCard = page
      .getByTestId("sitter-card")
      .filter({ has: page.getByTestId("sitter-card-matches") })
      .first();
    await expect(matchedCard).toBeVisible();
    await expect(matchedCard.getByTestId("sitter-card-matches")).toHaveText("Matches");
  });

  test("matches my sits filter shows only overlapping sitters", async ({ page }) => {
    await seedOwnerSession(page, {
      name: "Maya & Finn",
      email: "maya.finn@boatstead.mock",
      image: "https://i.pravatar.cc/160?img=5",
      phoneNumber: "6912345678",
      verified: true,
    });

    await page.goto("/sitters");
    await expect(page.getByTestId("sitters-matches-my-sits")).toBeVisible();
    await page.getByTestId("sitters-matches-my-sits").check();
    await expect(page).toHaveURL(/matchesMySits=1/);
    await expect(page.getByTestId("sitters-results")).toBeVisible();
    const cards = page.getByTestId("sitter-card");
    await expect(cards.first()).toBeVisible();
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i += 1) {
      await expect(cards.nth(i).getByTestId("sitter-card-matches")).toBeVisible();
    }
  });

  test("resets filters from the empty results state", async ({ page }) => {
    await page.goto("/sitters?q=zzzz-no-match-xyz&language=Japanese");
    await expect(page.getByTestId("sitters-empty")).toBeVisible();
    await page.getByTestId("sitters-reset-filters").click();
    await expect(page.getByTestId("sitters-empty")).toHaveCount(0);
    await expect(page).toHaveURL(/\/sitters\/?$/);
    await expect(page.getByTestId("sitters-language")).toHaveValue("");
    await expect(page.getByTestId("sitters-results-count")).toBeVisible();
  });

  test("nav link opens the sitters index", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("nav-find-sitter").click();
    await expect(page).toHaveURL(/\/sitters\/?$/);
    await expect(page.getByTestId("sitters-title")).toBeVisible();
  });
});
