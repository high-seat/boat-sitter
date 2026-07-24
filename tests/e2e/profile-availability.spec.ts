import { expect, test } from "@playwright/test";
import { seedOwnerSession } from "./helpers/auth";
import {
  deleteFreshTestUser,
  loginAsFreshTestUser,
  seedInviteFixture,
  type InviteFixture,
} from "./helpers/testUsers";

test.describe("profile upcoming availability", () => {
  test("shows upcoming windows on a sitter profile", async ({ page }) => {
    await seedOwnerSession(page, {
      name: "Maya & Finn",
      email: "maya.finn@boatstead.mock",
      image: "https://i.pravatar.cc/160?img=5",
      phoneNumber: "6912345678",
      verified: true,
    });

    await page.goto("/members/Alex%20Morgan");
    await expect(page.getByTestId("profile-upcoming-availability")).toBeVisible();
    await expect(page.getByTestId("profile-you-badge")).toHaveCount(0);
    await expect(page.getByTestId("profile-availability-list")).toBeVisible();
    await expect(page.getByTestId("profile-availability-list").locator("li").first()).toBeVisible();
    await expect(page.getByTestId("profile-languages")).toBeVisible();
    await expect(page.getByTestId("profile-languages")).toContainText("English");
    await expect(page.getByTestId("profile-languages")).toContainText("French");
  });

  test.describe("invite from matching availability", () => {
    let fixture: InviteFixture | undefined;

    test.afterEach(async ({ page }) => {
      if (!fixture) return;
      const { owner, sitter } = fixture;
      fixture = undefined;
      await deleteFreshTestUser(page, owner.id);
      await deleteFreshTestUser(page, sitter.id);
    });

    test("shows match badge and can request to sit when availability overlaps", async ({
      page,
    }) => {
      fixture = await seedInviteFixture(page);
      const { owner, sitter } = fixture;

      await page.goto(`/members/${encodeURIComponent(sitter.name)}`);
      await expect(page.getByTestId("profile-upcoming-availability")).toBeVisible();
      await expect(
        page.locator('[data-testid^="profile-availability-match-"]').first(),
      ).toBeVisible();
      const requestButton = page.locator('[data-testid^="profile-availability-request-"]').first();
      await expect(requestButton).toBeVisible();
      await expect(requestButton).toBeEnabled();
      await expect(requestButton).toContainText("Request to sit my boat");

      await requestButton.click();
      await expect(page.getByTestId("profile-invite-sitter-modal")).toBeVisible();
      await expect(page.getByTestId("profile-invite-sit-select")).toBeVisible();

      await page.getByTestId("profile-invite-send").click();
      await expect(page).toHaveURL(/\/messages\?application=/);
      const applicationId = new URL(page.url()).searchParams.get("application");
      expect(applicationId).toBeTruthy();

      const appsResponse = await page.request.get(
        `/api/applications?user=${encodeURIComponent(owner.name)}`,
      );
      expect(appsResponse.ok()).toBeTruthy();
      const appsBody = (await appsResponse.json()) as {
        data: Array<{ id: string; status: string }>;
      };
      expect(appsBody.data.find((app) => app.id === applicationId)?.status).toBe("invited");

      await page.goto(`/members/${encodeURIComponent(sitter.name)}`);
      const requestedButton = page
        .locator('[data-testid^="profile-availability-request-"]')
        .first();
      await expect(requestedButton).toBeVisible();
      await expect(requestedButton).toBeDisabled();
      await expect(requestedButton).toHaveText("Requested");

      // Sitter can open the thread (sanity that the invite reached them).
      await loginAsFreshTestUser(page, sitter);
      await page.goto(`/messages?application=${encodeURIComponent(applicationId!)}`);
      await expect(page.getByTestId("messages-invite-actions")).toBeVisible();
    });
  });

  test("shows manage link and empty CTA on own profile without windows", async ({ page }) => {
    await seedOwnerSession(page, {
      name: "Maya & Finn",
      email: "maya.finn@boatstead.mock",
      image: "https://i.pravatar.cc/160?img=5",
      phoneNumber: "6912345678",
      verified: true,
    });

    await page.goto("/members/me");
    await expect(page.getByTestId("profile-you-badge")).toBeVisible();
    await expect(page.getByTestId("profile-you-badge")).toHaveText("You");
    await expect(page.getByTestId("profile-upcoming-availability")).toBeVisible();
    await expect(page.getByTestId("profile-manage-availability")).toBeVisible();
    await expect(page.getByTestId("profile-availability-empty")).toBeVisible();
    await page.getByTestId("profile-availability-empty-action").click();
    await expect(page).toHaveURL(/\/availability\/?$/);
  });
});
