import { expect, test } from "@playwright/test";
import {
  deleteFreshTestUser,
  loginAsFreshTestUser,
  seedInviteFixture,
  type InviteFixture,
} from "./helpers/testUsers";

test.describe("owner invite to sit", () => {
  let fixture: InviteFixture | undefined;

  test.afterEach(async ({ page }) => {
    if (!fixture) return;
    const { owner, sitter } = fixture;
    fixture = undefined;
    await deleteFreshTestUser(page, owner.id);
    await deleteFreshTestUser(page, sitter.id);
  });

  test("owner can invite; sitter sees inbox, invited sits, accept lands with Invited badge", async ({
    page,
  }) => {
    fixture = await seedInviteFixture(page);
    const { owner, sitter, sitId } = fixture;

    await page.goto(`/members/${encodeURIComponent(sitter.name)}`);
    await expect(page.getByTestId("profile-upcoming-availability")).toBeVisible();
    await expect(page.getByTestId("profile-availability-list").locator("li").first()).toBeVisible();

    const requestButton = page.locator('[data-testid^="profile-availability-request-"]').first();
    await expect(requestButton).toBeVisible();
    await requestButton.click();
    await expect(page.getByTestId("profile-invite-sitter-modal")).toBeVisible();
    await page.getByTestId("profile-invite-send").click();
    await expect(page).toHaveURL(/\/messages\?application=/);
    const applicationId = new URL(page.url()).searchParams.get("application");
    expect(applicationId).toBeTruthy();

    const ownerApps = await page.request.get(
      `/api/applications?user=${encodeURIComponent(owner.name)}`,
    );
    expect(ownerApps.ok()).toBeTruthy();
    const ownerBody = (await ownerApps.json()) as {
      data: Array<{ id: string; status: string; invited?: boolean; sitId: string }>;
    };
    const invitedApp = ownerBody.data.find((app) => app.id === applicationId);
    expect(invitedApp?.status).toBe("invited");
    expect(invitedApp?.invited).toBe(true);
    expect(invitedApp?.sitId).toBe(sitId);

    await loginAsFreshTestUser(page, sitter);
    await page.goto("/messages");
    await expect(page.getByTestId(`conversation-row-${applicationId}`)).toBeVisible();
    await page.getByTestId(`conversation-row-${applicationId}`).click();
    await expect(page.getByTestId("messages-invite-actions")).toBeVisible();
    await expect(page.getByTestId("messages-accept-invite")).toBeVisible();
    await expect(page.getByTestId("messages-decline-invite")).toBeVisible();

    await page.getByTestId("notifications-open").first().click();
    await expect(page.getByTestId("notifications-menu")).toBeVisible();
    await expect(page.getByText(/invited you to sit/i).first()).toBeVisible();

    await page.goto("/my-sits");
    await expect(page.getByTestId("sitter-sits-phase-invited")).toBeVisible();
    await expect(page.getByTestId(`sitter-sit-card-${sitId}`)).toBeVisible();

    await page.goto(`/messages?application=${encodeURIComponent(applicationId!)}`);
    await page.getByTestId("messages-accept-invite").click();
    await expect(page.getByTestId("messages-accept-invite-dialog")).toBeVisible();
    await page.getByTestId("messages-accept-invite-confirm").click();
    await expect(page.getByTestId("messages-invite-actions")).toHaveCount(0);

    await page.goto("/my-sits");
    await expect(page.getByTestId("sitter-sits-phase-invited")).toHaveCount(0);

    await loginAsFreshTestUser(page, owner);
    await page.goto(`/owner/sits/${sitId}/applications`);
    await expect(page.getByTestId("application-applicant-list")).toBeVisible();
    await expect(page.getByText("Invited", { exact: true }).first()).toBeVisible();
  });

  test("declined invite system message names the boat and sit dates", async ({ page }) => {
    fixture = await seedInviteFixture(page);
    const { owner, sitter, boatName } = fixture;

    await page.goto(`/members/${encodeURIComponent(sitter.name)}`);
    const requestButton = page.locator('[data-testid^="profile-availability-request-"]').first();
    await expect(requestButton).toBeVisible();
    await requestButton.click();
    await page.getByTestId("profile-invite-send").click();
    await expect(page).toHaveURL(/\/messages\?application=/);
    const applicationId = new URL(page.url()).searchParams.get("application");
    expect(applicationId).toBeTruthy();

    await loginAsFreshTestUser(page, sitter);
    await page.goto(`/messages?application=${encodeURIComponent(applicationId!)}`);
    await page.getByTestId("messages-decline-invite").click();
    await expect(page.getByTestId("messages-decline-invite-dialog")).toBeVisible();
    await page.getByTestId("messages-decline-invite-confirm").click();

    const systemMessage = page.getByTestId("conversation-system-message").last();
    await expect(systemMessage).toContainText(boatName);
    await expect(systemMessage).toContainText(/Sep\s*1/);
    await expect(systemMessage).toContainText(/Sep\s*15/);

    await loginAsFreshTestUser(page, owner);
    await page.goto(`/messages?application=${encodeURIComponent(applicationId!)}`);
    const ownerSystemMessage = page.getByTestId("conversation-system-message").last();
    await expect(ownerSystemMessage).toContainText(sitter.name);
    await expect(ownerSystemMessage).toContainText(boatName);
    await expect(ownerSystemMessage).toContainText(/Sep\s*1/);
    await expect(ownerSystemMessage).toContainText(/Sep\s*15/);
    await expect(ownerSystemMessage).toContainText(/declined the invite/i);
  });
});
