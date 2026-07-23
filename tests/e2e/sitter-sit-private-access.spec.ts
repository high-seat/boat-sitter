import { expect, test } from "@playwright/test";
import { seedOwnerSession, seedVerifiedOwner } from "./helpers/auth";
import { seedDevFixture } from "./helpers/fixtures";

test.describe("accepted sitter private access on My sits", () => {
  test("shows Wi-Fi and full address on the accepted sit card", async ({ page, browser }) => {
    const ownerContext = await browser.newContext();
    const ownerPage = await ownerContext.newPage();
    await seedVerifiedOwner(ownerPage);
    await seedDevFixture(ownerPage, "underway-sit");
    await ownerContext.close();

    await seedOwnerSession(page, {
      name: "Alex Morgan",
      email: "alex.morgan@boatstead.mock",
      image: "https://i.pravatar.cc/160?img=11",
      phoneNumber: "7700900123",
    });

    await page.goto("/my-sits");
    const card = page.getByTestId("sitter-sit-card-sit-underway-emergency-e2e");
    await expect(card).toBeVisible();

    const access = card.getByTestId("sitter-sit-private-access").getByTestId("boat-access-details");
    await expect(access).toBeVisible();
    await expect(access.getByText(/Berth B12, Lefkas Marina/i)).toBeVisible();
    await expect(access.getByText("Solstice-Guest")).toBeVisible();
    await expect(access.getByText("aegean-sun-42")).toBeVisible();
  });

  test("hides private access before the application is accepted", async ({ page, browser }) => {
    const ownerContext = await browser.newContext();
    const ownerPage = await ownerContext.newPage();
    await seedVerifiedOwner(ownerPage);
    await seedDevFixture(ownerPage, "lifecycle-sit", { phase: "accepting" });
    await ownerContext.close();

    await seedOwnerSession(page, {
      name: "Alex Morgan",
      email: "alex.morgan@boatstead.mock",
      image: "https://i.pravatar.cc/160?img=11",
      phoneNumber: "7700900123",
    });

    await page.goto("/my-sits");
    const card = page.getByTestId("sitter-sit-card-sit-lifecycle-e2e");
    await expect(card).toBeVisible();
    await expect(card.getByTestId("sitter-sit-private-access")).toHaveCount(0);
    await expect(card.getByTestId("boat-access-details")).toHaveCount(0);
  });
});
