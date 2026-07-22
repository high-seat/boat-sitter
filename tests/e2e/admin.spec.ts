import { expect, test } from "@playwright/test";
import { seedOwnerSession, seedVerifiedOwner } from "./helpers/auth";

const ADMIN = {
  name: "Boatstead Admin",
  email: "admin@boatstead.mock",
  image: "https://api.dicebear.com/9.x/initials/svg?seed=Admin",
  phoneNumber: "5550100100",
  role: "admin" as const,
};

test.describe("admin console", () => {
  test("blocks non-admin members from /admin", async ({ page }) => {
    await seedVerifiedOwner(page);
    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: /Admin access required/i })).toBeVisible();
  });

  test("lets admins edit a user and records an audit entry", async ({ page }) => {
    await seedOwnerSession(page, ADMIN);
    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: /^Admin$/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /^Users$/i })).toBeVisible();

    const mayaRow = page.locator("li").filter({ hasText: "Maya & Finn" }).first();
    await expect(mayaRow).toBeVisible();
    await mayaRow.getByRole("button", { name: /Edit user/i }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: /Edit user/i })).toBeVisible();
    await dialog.getByLabel(/Location/i).fill("Athens, Greece");
    await dialog.getByRole("button", { name: /Save user/i }).click();
    await expect(dialog).toHaveCount(0);
    await expect(mayaRow).toContainText("Athens, Greece");

    await page.getByRole("button", { name: /Audit trail/i }).click();
    await expect(page.getByText(/User updated/i).first()).toBeVisible();
    await expect(page.getByText(/Maya & Finn/i).first()).toBeVisible();
  });

  test("lets admins delete a user with confirmation", async ({ page }) => {
    await seedOwnerSession(page, ADMIN);
    await page.goto("/admin");

    const alexRow = page.locator("li").filter({ hasText: "Alex Morgan" }).first();
    await expect(alexRow).toBeVisible();
    await alexRow.getByRole("button", { name: /Delete user/i }).click();

    const confirm = page.getByRole("dialog");
    await expect(confirm.getByRole("heading", { name: /Delete this user/i })).toBeVisible();
    await confirm.getByRole("button", { name: /Yes, delete user/i }).click();
    await expect(page.locator("li").filter({ hasText: "Alex Morgan" })).toHaveCount(0);

    await page.getByRole("button", { name: /Audit trail/i }).click();
    await expect(page.getByText(/User deleted/i).first()).toBeVisible();
  });
});
