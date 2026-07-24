import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem("i18nextLng", "en-US");
    localStorage.setItem("harbourly-language", "en-US");
  });
});

test("terms include a non-discrimination section", async ({ page }) => {
  await page.goto("/terms");

  const section = page.getByTestId("terms-non-discrimination-section");
  await expect(section).toBeVisible();
  await expect(section.getByRole("heading", { level: 2 })).toContainText(/Non-discrimination/i);
  await expect(section).toContainText(/religion/i);
  await expect(section).toContainText(/gender identity/i);
  await expect(section).toContainText(/sexual orientation/i);
  await expect(section).toContainText(/protected characteristics/i);
});

test("French terms include non-discrimination section", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("i18nextLng", "fr");
    localStorage.setItem("harbourly-language", "fr");
  });
  await page.goto("/terms");

  const section = page.getByTestId("terms-non-discrimination-section");
  await expect(section).toBeVisible();
  await expect(section.getByRole("heading", { level: 2 })).toContainText(/Non-discrimination/i);
  await expect(section).toContainText(/religion/i);
  await expect(section).toContainText(/identité de genre/i);
  await expect(section).toContainText(/orientation sexuelle/i);
});
