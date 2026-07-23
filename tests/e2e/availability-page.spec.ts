import { expect, test } from "@playwright/test";
import { seedOwnerSession } from "./helpers/auth";

async function pickAvailabilityDates(page: import("@playwright/test").Page) {
  await page.getByTestId("availability-dates-trigger").click();
  await expect(page.getByText(/When can you boat sit/i)).toBeVisible();

  const calendar = page.locator(".boatstead-rdp");
  await expect(calendar).toBeVisible();

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() + 21);
  const end = new Date(start);
  end.setDate(end.getDate() + 10);

  const toIso = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  async function selectDay(iso: string) {
    const cell = calendar.locator(`[data-day="${iso}"]:not([data-disabled])`);
    if ((await cell.count()) === 0) {
      await page.getByRole("button", { name: /Go to the Next Month|next month/i }).click();
    }
    await expect(calendar.locator(`[data-day="${iso}"]:not([data-disabled])`)).toBeVisible();
    await calendar.locator(`[data-day="${iso}"] button`).click();
  }

  await selectDay(toIso(start));
  await selectDay(toIso(end));
  await expect(page.getByTestId("availability-dates-trigger")).not.toContainText(/Any dates/i);
}

test.describe("sitter availability page", () => {
  test("matches shared header and blocks publish until dates are set", async ({ page }) => {
    await seedOwnerSession(page, {
      name: "Alex Morgan",
      email: "alex.morgan@boatstead.mock",
      image: "https://i.pravatar.cc/160?img=12",
      phoneNumber: "6911111111",
      verified: true,
    });

    await page.goto("/availability");
    await expect(page.getByTestId("availability-page")).toBeVisible();
    await expect(page.getByRole("heading", { name: /Your availability/i })).toHaveClass(
      /section-title/,
    );

    const publish = page.getByTestId("availability-publish");
    await expect(publish).toBeDisabled();
    await expect(publish).not.toHaveAttribute("title");

    await publish.hover({ force: true });
    await expect(page.getByRole("tooltip", { name: /Still needed:.*Dates/i })).toBeVisible();

    const destinations = page.getByTestId("availability-destinations");
    const destinationsInput = page.getByTestId("availability-destinations-input");
    await destinationsInput.click();
    await destinationsInput.fill("Croa");
    const option = destinations.getByRole("option", { name: /^Croatia/i }).first();
    await expect(option).toBeVisible({ timeout: 10_000 });
    await option.click();
    await expect(destinations.getByRole("button", { name: /Remove Croatia/i })).toBeVisible();
    await expect(destinationsInput).toHaveValue("");

    await pickAvailabilityDates(page);
    await expect(publish).toBeEnabled();
    await publish.hover();
    await expect(page.getByRole("tooltip", { name: /Still needed/i })).toHaveCount(0);

    await publish.click();
    await expect(page.getByTestId("availability-windows")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("availability-windows")).toContainText(/Croatia/i);
  });
});
