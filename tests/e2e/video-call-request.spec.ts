import { expect, test, type Browser } from "@playwright/test";
import { seedOwnerSession, seedVerifiedOwner } from "./helpers/auth";
import { fillVideoCallSchedule, setTimeFormatPreference } from "./helpers/videoCallSchedule";

async function openSitterMessages(browser: Browser) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await seedOwnerSession(page, {
    name: "Alex Morgan",
    email: "alex.morgan@boatstead.mock",
    image: "https://i.pravatar.cc/160?img=11",
    phoneNumber: "7700900123",
  });
  await setTimeFormatPreference(page, "24h");
  await page.goto("/messages");
  return { context, page };
}

test.describe("video call request", () => {
  test("owner sends video call request and message appears in chat", async ({ page }) => {
    await seedVerifiedOwner(page);
    await setTimeFormatPreference(page, "24h");
    await page.goto("/owner/sits/solstice/applications");
    await expect(page.getByRole("heading", { name: /Applications for/i })).toBeVisible();

    // Select the first applicant
    await page
      .getByRole("button", { name: /Samira Costa/i })
      .first()
      .click();

    // Check initial message count
    const initialMessages = await page
      .locator('[data-testid="conversation-messages"] > div')
      .count();

    // Open the video call modal
    await page.getByTestId("conversation-request-video-call").click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: /Propose a video call/i })).toBeVisible();

    // Fill the schedule form
    await fillVideoCallSchedule(dialog, page, { daysAhead: 5, time: "15:30", duration: "45" });

    // Submit the request
    await dialog.getByRole("button", { name: /Send proposal/i }).click();

    // Modal should close
    await expect(dialog).not.toBeVisible();

    // Video call message should appear in chat
    await expect(page.getByText(/Video call proposed/i).first()).toBeVisible();
    await expect(page.getByText(/Maya & Finn proposed a video call/i).first()).toBeVisible();
    await expect(page.getByText(/45 minutes/i).first()).toBeVisible();

    // The message should be aligned to the right (it's from "You")
    const videoRow = page.getByTestId("conversation-message-video-call").last();
    await expect(videoRow).toHaveClass(/justify-end/);
    await expect(videoRow.getByTestId("conversation-message-own")).toBeVisible();
    await expect(videoRow.getByTestId("conversation-message-avatar-own")).toBeVisible();
    await expect(videoRow.getByTestId("conversation-message-tail-own")).toBeVisible();
  });

  test("sitter sends video call request from messages page", async ({ browser }) => {
    // First, owner needs to have sent a message to create the conversation
    const ownerContext = await browser.newContext();
    const ownerPage = await ownerContext.newPage();
    await seedVerifiedOwner(ownerPage);
    await setTimeFormatPreference(ownerPage, "24h");
    await ownerPage.goto("/owner/sits/solstice/applications");
    await ownerPage
      .getByRole("button", { name: /Alex Morgan/i })
      .first()
      .click();
    await expect(ownerPage.getByTestId("conversation-messages")).toBeVisible();
    await ownerContext.close();

    // Now sitter logs in and requests video call
    const { context, page } = await openSitterMessages(browser);
    try {
      await expect(page.getByRole("heading", { name: /Messages/i })).toBeVisible();

      // Click on the conversation with Solstice
      await page
        .getByRole("button", { name: /Solstice/i })
        .first()
        .click();

      // Open video call modal
      await page.getByTestId("conversation-request-video-call").click();
      const dialog = page.getByRole("dialog");
      await expect(dialog.getByRole("heading", { name: /Propose a video call/i })).toBeVisible();

      // Fill and submit
      await fillVideoCallSchedule(dialog, page, { daysAhead: 7, time: "11:00", duration: "30" });
      await dialog.getByRole("button", { name: /Send proposal/i }).click();

      // Verify message appears
      await expect(page.getByText(/Video call proposed/i).first()).toBeVisible();
      await expect(page.getByText(/Alex Morgan proposed a video call/i).first()).toBeVisible();
    } finally {
      await context.close();
    }
  });

  test("video call request shows correct time details in message", async ({ page }) => {
    await seedVerifiedOwner(page);
    await setTimeFormatPreference(page, "12h");
    await page.goto("/owner/sits/solstice/applications");

    await page
      .getByRole("button", { name: /Alex Morgan/i })
      .first()
      .click();

    await page.getByTestId("conversation-request-video-call").click();
    const dialog = page.getByRole("dialog");

    // Choose specific duration
    await fillVideoCallSchedule(dialog, page, { daysAhead: 3, time: "09:00", duration: "60" });
    await dialog.getByRole("button", { name: /Send proposal/i }).click();

    await expect(page.getByText(/Video call proposed/i).first()).toBeVisible();
    await expect(page.getByTestId("conversation-video-call-when").last()).toContainText(/9:00/i);
    await expect(page.getByTestId("conversation-video-call-when").last()).toContainText(/AM/i);
    await expect(page.getByText(/60 minutes/i).first()).toBeVisible();
  });
});
