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
});
