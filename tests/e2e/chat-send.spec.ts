import { expect, test, type Page } from "@playwright/test";
import { seedOwnerSession, seedVerifiedOwner } from "./helpers/auth";
import {
  LIFECYCLE_APPLICATION_ID,
  LIFECYCLE_SIT_ID,
  seedDevFixture,
  seedLifecycleSit,
  type LifecycleSitPhase,
} from "./helpers/fixtures";

const ALEX = {
  name: "Alex Morgan",
  email: "alex.morgan@boatstead.mock",
  image: "https://i.pravatar.cc/160?img=11",
  phoneNumber: "7700900123",
} as const;

async function sendChatMessage(page: Page, text: string) {
  const reply = page.getByTestId("conversation-reply-input");
  await expect(reply).toBeVisible();
  await reply.fill(text);
  await page.getByTestId("conversation-send-reply").click();
  await expect(
    page.getByTestId("conversation-messages").getByText(text, { exact: true }),
  ).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId("toast-error")).toHaveCount(0);
  await expect(reply).toHaveValue("");
}

async function openOwnerLifecycleChat(page: Page, phase: LifecycleSitPhase) {
  await seedVerifiedOwner(page);
  await seedLifecycleSit(page, phase);
  await page.goto(`/owner/sits/${LIFECYCLE_SIT_ID}/applications`);
  if (phase === "underway" || phase === "completed") {
    await expect(page.getByTestId("active-sit-chat")).toBeVisible();
  } else {
    await page
      .getByRole("button", { name: /Alex Morgan/i })
      .first()
      .click();
  }
  await expect(page.getByTestId("conversation-messages")).toBeVisible();
}

test.describe("chat send — owner and sitter across sit phases", () => {
  for (const phase of ["accepting", "accepted", "underway", "completed"] as const) {
    test(`owner can send during ${phase}`, async ({ page }) => {
      await openOwnerLifecycleChat(page, phase);
      await sendChatMessage(page, `Owner ${phase} ping ${Date.now()}`);
    });

    test(`sitter can send during ${phase}`, async ({ page }) => {
      await seedVerifiedOwner(page);
      await seedLifecycleSit(page, phase);

      await seedOwnerSession(page, { ...ALEX, verified: true });
      // Re-apply so the sitter session claims applicantUserId on the lifecycle app.
      await seedLifecycleSit(page, phase);
      await page.goto(`/messages?application=${LIFECYCLE_APPLICATION_ID}`);
      await expect(page.getByTestId("conversation-messages")).toBeVisible();
      await sendChatMessage(page, `Sitter ${phase} ping ${Date.now()}`);
    });
  }
});

test.describe("chat send — ownership claim regression", () => {
  test("owner can send when vessel ownerUserId is null (name match claims)", async ({ page }) => {
    await seedVerifiedOwner(page);
    await seedDevFixture(page, "reset-solstice-open");
    await seedDevFixture(page, "unclaim-owned-vessels");

    await page.goto("/messages?application=application-alex-solstice");
    await expect(page.getByTestId("conversation-messages")).toBeVisible();

    const text = `Unclaimed owner ping ${Date.now()}`;
    const responsePromise = page.waitForResponse(
      (res) =>
        res.url().includes("/api/applications/application-alex-solstice/messages") &&
        res.request().method() === "POST",
    );
    await page.getByTestId("conversation-reply-input").fill(text);
    await page.getByTestId("conversation-send-reply").click();
    const response = await responsePromise;
    expect(response.status()).toBe(200);
    await expect(
      page.getByTestId("conversation-messages").getByText(text, { exact: true }),
    ).toBeVisible();
    await expect(page.getByTestId("toast-error")).toHaveCount(0);
  });
});

test.describe("chat send — blocked member", () => {
  test("owner can still send after blocking the sitter", async ({ page, browser }) => {
    await seedVerifiedOwner(page);
    await seedDevFixture(page, "reset-solstice-open");
    await seedDevFixture(page, "accept-solstice");

    const sitterContext = await browser.newContext();
    const sitterPage = await sitterContext.newPage();
    await seedOwnerSession(sitterPage, { ...ALEX, verified: true });
    const sitterText = `Sitter before block ${Date.now()}`;
    const sitterSend = await sitterPage.request.post(
      "/api/applications/application-alex-solstice/messages",
      { data: { text: sitterText } },
    );
    expect(sitterSend.ok()).toBeTruthy();
    await sitterContext.close();

    await page.goto("/messages?application=application-alex-solstice");
    await expect(page.getByTestId("conversation-messages")).toBeVisible();
    await expect(
      page.getByTestId("conversation-messages").getByText(sitterText, { exact: true }),
    ).toBeVisible();

    await page.getByTestId("conversation-row-actions-application-alex-solstice").click();
    await page.getByTestId("conversation-row-report-application-alex-solstice").click();
    const dialog = page.getByTestId("conversation-row-report-dialog-application-alex-solstice");
    await expect(dialog).toBeVisible();
    await dialog.getByTestId("report-also-block").click();
    await dialog.getByTestId("report-submit").click();
    await expect(dialog.getByRole("heading", { name: /Report submitted/i })).toBeVisible();
    await dialog.getByRole("button", { name: /Done/i }).click();

    await expect(page.getByTestId("conversation-composer")).toBeVisible();
    await sendChatMessage(page, `Owner after block ${Date.now()}`);

    await page.goto("/settings?tab=privacy");
    const blockedSection = page.getByTestId("settings-blocked-users");
    await expect(blockedSection).toBeVisible();
    await expect(blockedSection.getByText(ALEX.name, { exact: true })).toBeVisible();
  });
});
