import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem("i18nextLng", "en-US");
    localStorage.setItem(
      "harbourly",
      JSON.stringify({
        state: {
          saved: [],
          user: {
            name: "Alex Morgan",
            image: "https://i.pravatar.cc/160?img=11",
            bio: "Experienced boat sitter",
            location: "Brighton, United Kingdom",
            languages: ["English"],
            preferredCountries: [],
            skills: ["Line handling"],
            preferredLanguage: "en-US",
            measurementSystem: "metric",
          },
        },
        version: 3,
      }),
    );
  });
});

test("apply modal reiterates liveaboard sit type", async ({ page }) => {
  await page.goto("/boats/blue-hour");

  await page.getByRole("button", { name: "Apply to boat sit" }).click();

  const reminder = page.getByTestId("apply-sit-type-reminder");
  await expect(reminder).toBeVisible();
  await expect(reminder).toHaveAttribute("data-sit-type", "liveaboard");
  await expect(page.getByTestId("apply-sit-type-title")).toHaveText(/Sit type: Accommodation/i);
  await expect(page.getByTestId("apply-sit-type-meaning")).toHaveText(
    /You live and sleep aboard throughout the dates/i,
  );
  await expect(page.getByTestId("apply-party-size")).toBeVisible();

  const message = page.getByTestId("apply-message-input");
  const hint = page.getByTestId("apply-message-hint");
  await expect(hint).toBeVisible();
  await expect(hint).toHaveText(/Mention your experience with catamaran boats/i);
  const messageBottom = await message.evaluate((el) => el.getBoundingClientRect().bottom);
  const hintTop = await hint.evaluate((el) => el.getBoundingClientRect().top);
  expect(hintTop).toBeGreaterThanOrEqual(messageBottom - 1);
});

test("apply modal reiterates daytime checks sit type", async ({ page }) => {
  await page.goto("/boats/sea-glass");

  await page.getByRole("button", { name: "Apply to boat sit" }).click();

  const reminder = page.getByTestId("apply-sit-type-reminder");
  await expect(reminder).toBeVisible();
  await expect(reminder).toHaveAttribute("data-sit-type", "daytimeChecks");
  await expect(page.getByTestId("apply-sit-type-title")).toHaveText(/Sit type: Daytime checks/i);
  await expect(page.getByTestId("apply-sit-type-meaning")).toHaveText(
    /not permitted to stay overnight/i,
  );
  await expect(page.getByTestId("apply-party-size")).toHaveCount(0);

  const message = page.getByTestId("apply-message-input");
  const hint = page.getByTestId("apply-message-hint");
  await expect(hint).toBeVisible();
  await expect(hint).toHaveText(/Mention your experience with motor yacht boats/i);
  const messageBottom = await message.evaluate((el) => el.getBoundingClientRect().bottom);
  const hintTop = await hint.evaluate((el) => el.getBoundingClientRect().top);
  expect(hintTop).toBeGreaterThanOrEqual(messageBottom - 1);
});
