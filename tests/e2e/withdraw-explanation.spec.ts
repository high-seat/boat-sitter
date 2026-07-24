import { expect, test } from "@playwright/test";
import { seedOwnerSession } from "./helpers/auth";
import { seedDevFixture } from "./helpers/fixtures";

test.describe("withdraw with explanation", () => {
  test("sitter can withdraw with an optional one-time explanation", async ({ page, browser }) => {
    const ownerContext = await browser.newContext();
    const ownerPage = await ownerContext.newPage();
    await seedOwnerSession(ownerPage, { verified: true });
    await seedDevFixture(ownerPage, "reset-solstice-open");
    await ownerContext.close();

    await seedOwnerSession(page, {
      name: "Alex Morgan",
      email: "alex.morgan@boatstead.mock",
      image: "https://i.pravatar.cc/160?img=11",
      phoneNumber: "7700900123",
      verified: true,
    });

    await page.goto("/my-sits");
    await expect(page.getByRole("heading", { name: /My sits/i })).toBeVisible();

    const withdraw = page.getByTestId("sitter-sit-withdraw-solstice");
    await expect(withdraw).toBeVisible();
    await withdraw.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: /Withdraw your interest/i })).toBeVisible();
    await expect(dialog.getByLabel(/Optional explanation/i)).toBeVisible();
    await dialog
      .getByLabel(/Optional explanation/i)
      .fill("Dates no longer work for me after a schedule change.");
    await dialog.getByRole("button", { name: /Yes, withdraw/i }).click();

    await expect(page.getByTestId("sitter-sits-phase-withdrawn")).toBeVisible();
    const withdrawnCard = page
      .getByTestId("sitter-sits-phase-withdrawn")
      .getByTestId("sitter-sit-card-solstice");
    await expect(withdrawnCard).toBeVisible();

    await withdrawnCard.getByRole("link", { name: /^Messages$/i }).click();
    await expect(page.getByText(/Interest withdrawn/i).first()).toBeVisible();
    await expect(page.getByText(/You withdrew your interest in this sit/i).first()).toBeVisible();
    await expect(
      page.getByText(/Dates no longer work for me after a schedule change/i).first(),
    ).toBeVisible();
  });
});
