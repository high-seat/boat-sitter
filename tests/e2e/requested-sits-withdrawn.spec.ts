import { expect, test } from "@playwright/test";
import { seedOwnerSession } from "./helpers/auth";
import { seedDevFixture } from "./helpers/fixtures";

test.describe("withdrawn requested sits", () => {
  test("moves withdrawn applications into a separate section", async ({ page }) => {
    await seedOwnerSession(page, {
      name: "Alex Morgan",
      email: "alex.morgan@boatstead.mock",
      image: "https://i.pravatar.cc/160?img=11",
      phoneNumber: "7700900123",
    });

    const withdraw = await page.request.post(
      "/api/applications/application-alex-solstice/withdraw",
      {
        data: { explanation: "E2E withdraw" },
      },
    );
    if (!withdraw.ok()) {
      throw new Error(`Withdraw failed (${withdraw.status()}): ${await withdraw.text()}`);
    }
    await seedDevFixture(page, "alex-blue-hour-accepted");

    await page.goto("/my-sits");
    await expect(page.getByRole("heading", { name: /My sits/i })).toBeVisible();

    const requested = page.locator("section").filter({
      has: page.getByRole("heading", { name: /^Requested sits$/i }),
    });
    const withdrawn = page.locator("section").filter({
      has: page.getByRole("heading", { name: /^Withdrawn$/i }),
    });

    await expect(requested).toBeVisible();
    await expect(withdrawn).toBeVisible();
    await expect(requested.locator("article").filter({ hasText: /Solstice/i })).toHaveCount(0);
    await expect(withdrawn.locator("article").filter({ hasText: /Solstice/i })).toHaveCount(1);
    await expect(withdrawn.getByText(/^Withdrawn$/i).first()).toBeVisible();
    await expect(requested.getByText(/^Accepted$/i).first()).toBeVisible();
    await expect(requested.locator("article").filter({ hasText: /Withdrawn/i })).toHaveCount(0);
    await expect(
      withdrawn
        .locator("article")
        .filter({ hasText: /Solstice/i })
        .getByRole("img")
        .first(),
    ).toBeVisible();
    await expect(requested.locator("article").getByRole("img").first()).toBeVisible();
  });
});
