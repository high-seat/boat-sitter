import { expect, test, type Page } from "@playwright/test";
import { seedUnverifiedOwner, seedVerifiedOwner } from "./helpers/auth";
import {
  fillMinimalCreateSitForm,
  openCreateSitModal,
  publishSit,
  sitEditorPage,
} from "./helpers/sitEditor";

async function sitsTabCount(page: Page) {
  const label = await page.getByRole("button", { name: /^Sits/i }).innerText();
  const match = label.match(/(\d+)/);
  return match ? Number(match[1]) : 0;
}

async function waitForOwnedBoats(page: Page) {
  await expect(page.getByRole("heading", { name: /Manage boats/i })).toBeVisible();
  await expect
    .poll(async () => {
      const label = await page.getByRole("button", { name: /^Boats/i }).innerText();
      const match = label.match(/(\d+)/);
      return match ? Number(match[1]) : 0;
    })
    .toBeGreaterThan(0);
}

test.describe("sit creation flow", () => {
  test("opens the create sit editor from the owner dashboard", async ({ page }) => {
    await seedVerifiedOwner(page);
    const modal = await openCreateSitModal(page);

    await expect(modal.getByText(/Editable until someone applies/i)).toBeVisible();
    await expect(modal.getByRole("radio", { name: /Accommodation/i })).toBeChecked();
    await expect(modal.getByText(/^Region$/i)).toHaveCount(0);
    await expect(modal.getByText(/for example Mediterranean/i)).toHaveCount(0);
    await expect(modal.locator(".form-label", { hasText: /^Full address$/i })).toBeVisible();
    await expect(
      modal.getByText(/Not shared until you accept an applicant/i),
    ).toBeVisible();
    const publish = modal.getByRole("button", { name: /Publish sit/i });
    await expect(publish).toBeDisabled();
    await expect(publish).toHaveAttribute("title", /Still needed:.*Sit dates/i);
    await expect(publish).toHaveAttribute("title", /Full address/i);
    await publish.hover();
    await expect(page.getByRole("tooltip", { name: /Still needed:.*Sit dates/i })).toBeVisible();
    await expect(modal.getByRole("complementary", { name: /Live preview/i })).toBeVisible();
    await expect(modal.getByText(/How it will look/i )).toBeVisible();
    await expect(modal.getByText(/Solstice/i).first()).toBeVisible();
  });

  test("live preview updates when sit type and dates change", async ({ page }) => {
    await seedVerifiedOwner(page);
    const modal = await openCreateSitModal(page);
    const preview = modal.getByRole("complementary", { name: /Live preview/i });

    await expect(preview.getByText(/Accommodation|Daytime/i).first()).toBeVisible();
    await modal.getByRole("radio", { name: /Daytime checks/i }).check();
    await expect(preview.getByText(/Daytime/i).first()).toBeVisible();

    await expect(preview.getByText(/Choose dates to complete the listing preview/i)).toBeVisible();
    await fillMinimalCreateSitForm(modal, page, {
      sitType: "daytimeChecks",
      responsibilities: "Preview date check",
    });
    await expect(preview.getByText(/Choose dates to complete the listing preview/i)).toHaveCount(0);
    await expect(preview.getByText(/nights/i).first()).toBeVisible();
  });

  test("requires terms agreement before publishing", async ({ page }) => {
    await seedVerifiedOwner(page);
    const modal = await openCreateSitModal(page);
    await fillMinimalCreateSitForm(modal, page, {
      responsibilities: "E2E terms gate responsibilities",
    });

    const termsCheckbox = modal.locator('label:has(a[href="/terms"]) input[type="checkbox"]');
    await termsCheckbox.scrollIntoViewIfNeeded();
    await termsCheckbox.uncheck();

    const publish = modal.getByRole("button", { name: /Publish sit/i });
    await expect(publish).toBeEnabled();
    await publish.click();

    await expect(modal.getByRole("alert")).toContainText(/agree to the Terms of Service/i);
    await expect(modal.getByRole("heading", { name: /Create a boat sit/i })).toBeVisible();
  });

  test("publishes an accommodation sit and lists it on the dashboard", async ({ page }) => {
    await seedVerifiedOwner(page);
    await page.goto("/owner/boats");
    await waitForOwnedBoats(page);
    await page.getByRole("button", { name: /^Sits/i }).click();
    const beforeCount = await sitsTabCount(page);

    const modal = await openCreateSitModal(page);
    await fillMinimalCreateSitForm(modal, page, {
      sitType: "liveaboard",
      responsibilities: "Daily bilge check\nBattery check\nLine inspection",
      maxGuests: 3,
    });
    await publishSit(modal);

    await expect(page).toHaveURL(/\/owner\/boats/);
    await expect(sitEditorPage(page)).toHaveCount(0);
    await expect.poll(async () => sitsTabCount(page)).toBe(beforeCount + 1);
    await expect(page.getByText(/3 care tasks/i)).toBeVisible();
  });

  test("publishes a daytime checks sit", async ({ page }) => {
    await seedVerifiedOwner(page);
    await page.goto("/owner/boats");
    await waitForOwnedBoats(page);
    await page.getByRole("button", { name: /^Sits/i }).click();
    const beforeCount = await sitsTabCount(page);

    const modal = await openCreateSitModal(page);
    await fillMinimalCreateSitForm(modal, page, {
      sitType: "daytimeChecks",
      responsibilities: "Morning systems walk\nDock line check",
    });
    await publishSit(modal);

    await expect(page).toHaveURL(/\/owner\/boats/);
    await expect(sitEditorPage(page)).toHaveCount(0);
    await expect.poll(async () => sitsTabCount(page)).toBe(beforeCount + 1);
    await expect(page.getByText(/2 care tasks/i)).toBeVisible();
  });

  test("blocks create when identity verification is incomplete", async ({ page }) => {
    await seedUnverifiedOwner(page);
    await page.goto("/owner/boats");
    await waitForOwnedBoats(page);
    await page.getByRole("button", { name: /^Sits/i }).click();
    await page.getByRole("button", { name: /Create a sit/i }).click();

    await expect(page).toHaveURL(/\/owner\/sits\/new/);
    const editor = sitEditorPage(page);
    await expect(editor.getByRole("heading", { name: /Create a boat sit/i })).toBeVisible();
    await expect(editor.getByText(/Verify your identity to create a sit/i )).toBeVisible();
    await expect(editor.getByRole("button", { name: /Publish sit/i })).toHaveCount(0);
  });
});
