import { expect, type Locator, type Page } from "@playwright/test";

export function futureDate(daysAhead: number) {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  return date;
}

export function futureDateIso(daysAhead: number) {
  const date = futureDate(daysAhead);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

/** Fill the branded video-call date/time/duration controls inside a schedule dialog. */
export async function fillVideoCallSchedule(
  dialog: Locator,
  page: Page,
  options: { daysAhead: number; time: string; duration?: string },
) {
  const target = futureDate(options.daysAhead);
  await dialog.getByRole("button", { name: /^Date$/i }).click();
  const dayName = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(target);
  const dayButton = page.getByRole("button", {
    name: new RegExp(dayName.replaceAll(",", ".*"), "i"),
  });
  if (await dayButton.count()) {
    await dayButton.first().click();
  } else {
    // Fallback for locale-specific DayPicker labels: match the day number in the open calendar.
    await page
      .locator(".boatstead-rdp")
      .getByRole("button", { name: new RegExp(`^${target.getDate()}$`) })
      .first()
      .click();
  }

  const [hour, minute] = options.time.split(":");
  await dialog.getByRole("button", { name: /^Time$/i }).click();
  await page
    .getByRole("listbox", { name: /^Hour$/i })
    .getByRole("option", { name: hour })
    .click();
  await page
    .getByRole("listbox", { name: /^Minute$/i })
    .getByRole("option", { name: minute })
    .click();

  if (options.duration) {
    await dialog.locator("select").selectOption(options.duration);
  }

  await expect(dialog.getByRole("button", { name: /^Time$/i })).toContainText(options.time);
}
