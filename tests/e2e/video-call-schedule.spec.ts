import { expect, test, type Browser } from "@playwright/test";
import { seedOwnerSession, seedVerifiedOwner } from "./helpers/auth";
import { fillVideoCallSchedule } from "./helpers/videoCallSchedule";

async function openAlexMessages(browser: Browser) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await seedOwnerSession(page, {
    name: "Alex Morgan",
    email: "alex.morgan@boatstead.mock",
    image: "https://i.pravatar.cc/160?img=11",
    phoneNumber: "7700900123",
  });
  await page.goto("/messages");
  return { context, page };
}

test.describe("video call scheduling", () => {
  test("owner proposes a date, time, and duration", async ({ page }) => {
    await seedVerifiedOwner(page);
    await page.goto("/owner/sits/solstice/applications");
    await expect(page.getByRole("heading", { name: /Applications for/i })).toBeVisible();

    await page
      .getByRole("button", { name: /Alex Morgan/i })
      .first()
      .click();
    await expect(page.getByText(/Propose a date, time, and length before accepting/i)).toHaveCount(
      0,
    );
    await page.getByRole("button", { name: /Request video call/i }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: /Propose a video call/i })).toBeVisible();

    await fillVideoCallSchedule(dialog, page, { daysAhead: 3, time: "14:30", duration: "45" });
    await dialog.getByRole("button", { name: /Send proposal/i }).click();

    await expect(page.getByText(/Video call proposed/i).first()).toBeVisible();
    await expect(page.getByText(/Maya & Finn proposed a video call/i).first()).toBeVisible();
    await expect(page.getByText(/45 minutes/i).first()).toBeVisible();

    const videoCard = page
      .getByText(/Video call proposed/i)
      .first()
      .locator("xpath=ancestor::div[contains(@class,'rounded-2xl')][1]");
    const videoRow = videoCard.locator("xpath=..");
    await expect(videoRow).toHaveClass(/justify-end/);
    await expect(videoRow).not.toHaveClass(/justify-center/);
  });

  test("other party can suggest a different time", async ({ page, browser }) => {
    await seedVerifiedOwner(page);
    await page.goto("/owner/sits/solstice/applications");
    await page
      .getByRole("button", { name: /Alex Morgan/i })
      .first()
      .click();
    await page.getByRole("button", { name: /Request video call/i }).click();
    const dialog = page.getByRole("dialog");
    await fillVideoCallSchedule(dialog, page, { daysAhead: 2, time: "11:00" });
    await dialog.getByRole("button", { name: /Send proposal/i }).click();
    await expect(page.getByText(/Video call proposed/i).first()).toBeVisible();

    const { context, page: sitterPage } = await openAlexMessages(browser);
    try {
      await expect(sitterPage.getByRole("heading", { name: /Messages/i })).toBeVisible();
      await sitterPage
        .getByRole("button", { name: /New.*proposed a video call/i })
        .first()
        .click();
      await expect(sitterPage.getByRole("button", { name: /Accept time/i })).toBeVisible();
      const incomingCard = sitterPage
        .getByText(/Video call proposed/i)
        .first()
        .locator("xpath=ancestor::div[contains(@class,'rounded-2xl')][1]");
      await expect(incomingCard.locator("xpath=..")).toHaveClass(/justify-start/);
      await sitterPage.getByRole("button", { name: /Suggest different time/i }).click();
      const adjust = sitterPage.getByRole("dialog");
      await expect(
        adjust.getByRole("heading", { name: /Suggest a different time/i }),
      ).toBeVisible();
      await fillVideoCallSchedule(adjust, sitterPage, {
        daysAhead: 4,
        time: "16:00",
        duration: "30",
      });
      await adjust.getByRole("button", { name: /Send new time/i }).click();
      await expect(sitterPage.getByText(/New time suggested/i).first()).toBeVisible();
      await expect(
        sitterPage.getByText(/Alex Morgan suggested a different time/i).first(),
      ).toBeVisible();
    } finally {
      await context.close();
    }
  });

  test("accepted call shows Google and Apple calendar links", async ({ page, browser }) => {
    await seedVerifiedOwner(page);
    await page.goto("/owner/sits/solstice/applications");
    await page
      .getByRole("button", { name: /Alex Morgan/i })
      .first()
      .click();
    await page.getByRole("button", { name: /Request video call/i }).click();
    const dialog = page.getByRole("dialog");
    await fillVideoCallSchedule(dialog, page, { daysAhead: 2, time: "15:00", duration: "30" });
    await dialog.getByRole("button", { name: /Send proposal/i }).click();
    await expect(page.getByText(/Video call proposed/i).first()).toBeVisible();

    const { context, page: sitterPage } = await openAlexMessages(browser);
    try {
      await sitterPage
        .getByRole("button", { name: /New.*proposed a video call/i })
        .first()
        .click();
      await sitterPage.getByRole("button", { name: /Accept time/i }).click();
      await expect(sitterPage.getByText(/Video call confirmed/i).first()).toBeVisible();
      await expect(sitterPage.getByText(/Add to calendar/i).first()).toBeVisible();

      const google = sitterPage.getByRole("link", { name: /Google Calendar/i }).first();
      const apple = sitterPage.getByRole("link", { name: /Apple Calendar/i }).first();
      await expect(google).toBeVisible();
      await expect(apple).toBeVisible();
      await expect(google).toHaveAttribute(
        "href",
        /https:\/\/calendar\.google\.com\/calendar\/render\?/,
      );
      await expect(apple).toHaveAttribute("href", /^data:text\/calendar/);
      await expect(apple).toHaveAttribute("download", "boatstead-video-call.ics");
    } finally {
      await context.close();
    }
  });
});
