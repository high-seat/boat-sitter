import { expect, test } from "@playwright/test";

test.describe("language support", () => {
  test("footer lists Scandinavian and Japanese locales", async ({ page }) => {
    await page.goto("/");
    const language = page.getByLabel(/Language|Sprache|Språk|Kieli|言語/i);
    await expect(language).toBeVisible();
    await expect(language.locator('option[value="sv"]')).toHaveText(/Svenska/);
    await expect(language.locator('option[value="nb"]')).toHaveText(/Norsk/);
    await expect(language.locator('option[value="da"]')).toHaveText(/Dansk/);
    await expect(language.locator('option[value="fi"]')).toHaveText(/Suomi/);
    await expect(language.locator('option[value="ja"]')).toHaveText(/日本語/);
  });

  test("switching to Swedish and Japanese updates UI chrome", async ({ page }) => {
    await page.goto("/");
    const language = page.getByLabel(/Language|Sprache|Språk|Kieli|言語/i);

    await language.selectOption("sv");
    await expect(page.getByRole("link", { name: /Hitta en båt/i })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "sv");

    await language.selectOption("ja");
    await expect(page.getByRole("link", { name: /ボートを探す|船を探す|艇を探す/i })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "ja");
  });
});
