import { expect, test } from "@playwright/test";

test.describe("sit type search filter", () => {
  test("filters boats to accommodation or daytime checks", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.clear();
      localStorage.setItem("i18nextLng", "en-US");
      localStorage.setItem("harbourly-language", "en-US");
    });

    await page.goto("/boats?q=Sausalito&sitType=daytimeChecks");
    await expect(page.getByLabel(/^Sit type$/i)).toHaveValue("daytimeChecks");
    await expect(page.getByRole("heading", { name: /Sea Glass/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /^Solstice$/i })).toHaveCount(0);

    await page.goto("/boats?q=Lefkada&sitType=liveaboard");
    await expect(page.getByLabel(/^Sit type$/i)).toHaveValue("liveaboard");
    await expect(page.getByRole("heading", { name: /^Solstice$/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Sea Glass/i })).toHaveCount(0);

    await page.getByLabel(/^Sit type$/i).selectOption("all");
    await expect(page).not.toHaveURL(/sitType=/);
  });

  test("homepage search passes sit type to boats page", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.clear();
      localStorage.setItem("i18nextLng", "en-US");
      localStorage.setItem("harbourly-language", "en-US");
    });
    await page.goto("/");
    await page.getByLabel(/^Sit type$/i).selectOption("daytimeChecks");
    await page.getByRole("button", { name: /^Search$/i }).click();
    await expect(page).toHaveURL(/\/boats\?.*sitType=daytimeChecks/);
    await expect(page.getByLabel(/^Sit type$/i)).toHaveValue("daytimeChecks");
  });
});
