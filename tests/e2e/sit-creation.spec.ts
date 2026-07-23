import { expect, test, type Page } from "@playwright/test";
import { seedOwnerSession, seedVerifiedOwner } from "./helpers/auth";
import {
  fillMinimalCreateSitForm,
  openCreateSitModal,
  publishSit,
  sitEditorPage,
} from "./helpers/sitEditor";

async function sitsTabCount(page: Page) {
  const label = await page.locator('main a[href="/my-sits"]').innerText();
  const match = label.match(/(\d+)/);
  return match ? Number(match[1]) : 0;
}

async function waitForOwnedBoats(page: Page) {
  await expect(page.getByRole("heading", { name: /My sits/i })).toBeVisible();
  await expect
    .poll(async () => {
      const label = await page.locator('main a[href="/my-boats"]').innerText();
      const match = label.match(/(\d+)/);
      return match ? Number(match[1]) : 0;
    })
    .toBeGreaterThan(0);
}

test.describe("sit creation flow", () => {
  test("opens the create sit editor from the owner dashboard", async ({ page }) => {
    await seedVerifiedOwner(page);
    const modal = await openCreateSitModal(page);

    await expect(modal.getByText(/Keep boat details up to date/i)).toBeVisible();
    await expect(
      modal.getByText(/Photos, systems, and amenities come from the boat profile/i),
    ).toBeVisible();
    await expect(modal.getByRole("link", { name: /Update boat details/i })).toHaveAttribute(
      "href",
      /\/owner\/boats\/.+\/edit/,
    );
    await expect(modal.getByText(/Editable until someone applies/i)).toBeVisible();
    await expect(modal.getByRole("radio", { name: /Accommodation/i })).toBeChecked();
    await expect(modal.getByTestId("sit-editor-max-guests")).toBeVisible();
    await expect(modal.getByText(/^Region$/i)).toHaveCount(0);
    await expect(modal.getByText(/e\.g\. Mediterranean/i)).toHaveCount(0);
    await expect(
      modal.getByTestId("form-label-required").filter({ hasText: /Full address/i }),
    ).toBeVisible();
    await expect(
      modal.getByTestId("form-label-required").filter({ hasText: /Sit type/i }),
    ).toBeVisible();
    await expect(
      modal.getByTestId("form-label-required").filter({ hasText: /Sit location/i }),
    ).toBeVisible();
    await expect(modal.getByText(/Not shared until you accept an applicant/i)).toBeVisible();
    const publish = modal.getByTestId("sit-publish");
    await expect(publish).toBeDisabled();
    await expect(publish).not.toHaveAttribute("title");
    await publish.hover({ force: true });
    const blocked = page.getByRole("tooltip", { name: /Still needed:/i });
    await expect(blocked).toBeVisible();
    await expect(blocked).toContainText(/Sit dates/i);
    await expect(blocked).toContainText(/Full address/i);
    await expect(blocked).not.toContainText(/Full address.*Full address/i);
    await expect(modal.getByRole("complementary", { name: /Live preview/i })).toBeVisible();
    await expect(modal.getByText(/How it will look/i)).toBeVisible();
    await expect(modal.getByText(/Solstice/i).first()).toBeVisible();
  });

  test("live preview updates when sit type and dates change", async ({ page }) => {
    await seedVerifiedOwner(page);
    const modal = await openCreateSitModal(page);
    const preview = modal.getByRole("complementary", { name: /Live preview/i });

    await expect(preview.getByText(/Accommodation|Daytime/i).first()).toBeVisible();
    await modal.getByRole("radio", { name: /Daytime checks/i }).check();
    await expect(preview.getByText(/Daytime/i).first()).toBeVisible();
    await expect(modal.getByTestId("sit-editor-max-guests")).toHaveCount(0);

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
    await page.goto("/my-sits");
    await waitForOwnedBoats(page);
    const beforeCount = await sitsTabCount(page);

    const modal = await openCreateSitModal(page);
    await fillMinimalCreateSitForm(modal, page, {
      sitType: "liveaboard",
      responsibilities: "Daily bilge check\nBattery check\nLine inspection",
      maxGuests: 3,
    });
    await publishSit(modal);

    await expect(page).toHaveURL(/\/my-sits/);
    await expect(sitEditorPage(page)).toHaveCount(0);
    await expect.poll(async () => sitsTabCount(page)).toBe(beforeCount + 1);
    await expect(page.getByText(/3 care tasks/i)).toBeVisible();
  });

  test("publishes a daytime checks sit", async ({ page }) => {
    await seedVerifiedOwner(page);
    await page.goto("/my-sits");
    await waitForOwnedBoats(page);
    const beforeCount = await sitsTabCount(page);

    const modal = await openCreateSitModal(page);
    await fillMinimalCreateSitForm(modal, page, {
      sitType: "daytimeChecks",
      responsibilities: "Morning systems walk\nDock line check",
    });
    await publishSit(modal);

    await expect(page).toHaveURL(/\/my-sits/);
    await expect(sitEditorPage(page)).toHaveCount(0);
    await expect.poll(async () => sitsTabCount(page)).toBe(beforeCount + 1);
    await expect(page.getByText(/2 care tasks/i).first()).toBeVisible();
  });

  test("blocks create when identity verification is incomplete", async ({ page }) => {
    await seedOwnerSession(page, {
      verified: false,
      featureFlags: { requireVerificationToSit: true },
    });
    await page.goto("/my-sits");
    await waitForOwnedBoats(page);
    await page.getByRole("button", { name: /Create a sit/i }).click();

    await expect(page).toHaveURL(/\/owner\/sits\/new/);
    const editor = sitEditorPage(page);
    await expect(editor.getByRole("heading", { name: /Create a boat sit/i })).toBeVisible();
    await expect(editor.getByText(/Verify your identity to create a sit/i)).toBeVisible();
    await expect(editor.getByRole("button", { name: /Publish sit/i })).toHaveCount(0);
  });
});
