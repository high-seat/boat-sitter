import { expect, test } from "@playwright/test";

test.describe("error boundary", () => {
  test("shows nautical copy in English and German", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("i18nextLng", "en-US");
      localStorage.setItem("harbourly-language", "en-US");
    });

    await page.goto("/?crash=1");
    await expect(page.getByTestId("error-boundary")).toBeVisible();
    await expect(page.getByTestId("error-boundary-title")).toHaveText("We've run aground");
    await expect(page.getByTestId("error-boundary-text")).toHaveText(
      "We hit an unexpected snag. Try again, or head back to harbor.",
    );
    await expect(page.getByTestId("error-boundary-go-home")).toHaveText("Back to harbor");

    await page.addInitScript(() => {
      localStorage.setItem("i18nextLng", "de");
      localStorage.setItem("harbourly-language", "de");
    });
    await page.goto("/?crash=1");
    await expect(page.getByTestId("error-boundary-title")).toHaveText(
      "Wir sind auf Grund gelaufen",
    );
    await expect(page.getByTestId("error-boundary-go-home")).toHaveText("Zurück zum Hafen");
  });
});
