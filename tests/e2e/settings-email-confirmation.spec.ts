import { expect, test } from "@playwright/test";
import { seedOwnerSession } from "./helpers/auth";

test.describe("settings email confirmation", () => {
  test("shows confirmed status when email is confirmed", async ({ page }) => {
    await seedOwnerSession(page, { emailConfirmed: true });
    await page.goto("/settings?tab=security");
    await expect(page.getByTestId("email-confirmation-status")).toHaveText("Confirmed");
    await expect(page.getByRole("button", { name: "Resend confirmation link" })).toHaveCount(0);
  });

  test("shows unconfirmed status and can resend confirmation link", async ({ page }) => {
    await seedOwnerSession(page, { emailConfirmed: false });
    await page.goto("/settings?tab=security");
    await expect(page.getByTestId("email-confirmation-status")).toHaveText("Not confirmed");
    await page.getByRole("button", { name: "Resend confirmation link" }).click();
    await expect(page.getByRole("status")).toHaveText("Confirmation email sent");
  });

  test("change email dialog shows current email as text, not an input", async ({ page }) => {
    await seedOwnerSession(page, { emailConfirmed: true });
    await page.goto("/settings?tab=security");
    await page.getByRole("button", { name: /Change email/i }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: /Change email/i })).toBeVisible();
    await expect(dialog.getByText(/maya\.finn@boatstead\.mock/i)).toBeVisible();
    await expect(dialog.locator('input[type="email"]')).toHaveCount(1);
    await expect(dialog.getByLabel(/New email/i)).toBeVisible();
    await expect(dialog.locator('input[readonly]')).toHaveCount(0);
  });
});
