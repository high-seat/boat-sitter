import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem("i18nextLng", "en-US");
    localStorage.setItem("harbourly-language", "en-US");
  });
});

test("how-it-works callout mentions daytime checks exception", async ({ page }) => {
  await page.goto("/how-it-works");

  const callout = page.getByTestId("how-liveaboard-callout");
  await expect(callout).toBeVisible();
  await expect(callout.getByRole("heading", { level: 2 })).toHaveText(/Most sits are liveaboard/i);
  await expect(callout).toContainText(/Daytime checks are the exception/i);
  await expect(callout).toContainText(/during the day only/i);
  await expect(callout).toContainText(/does not stay overnight/i);
});

test("safety callout mentions daytime checks exception", async ({ page }) => {
  await page.goto("/safety");

  const callout = page.getByTestId("safety-liveaboard-callout");
  await expect(callout).toBeVisible();
  await expect(callout).toContainText(/Most sits are liveaboard/i);
  await expect(callout).toContainText(/Daytime checks are the exception/i);
});

test("terms liveaboard section allows daytime checks exception", async ({ page }) => {
  await page.goto("/terms");

  const section = page.getByTestId("terms-liveaboard-section");
  await expect(section).toBeVisible();
  await expect(section).toContainText(/Daytime checks are the exception/i);
  await expect(section).not.toContainText(/not a day-check service/i);
});

test("French how-it-works callout mentions day-visit exception", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("i18nextLng", "fr");
    localStorage.setItem("harbourly-language", "fr");
  });
  await page.goto("/how-it-works");

  const callout = page.getByTestId("how-liveaboard-callout");
  await expect(callout).toBeVisible();
  await expect(callout).toContainText(/visites de jour/i);
});
