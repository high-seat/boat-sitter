import { expect, type Locator, type Page } from "@playwright/test";
import { formatClockTime, to12HourClock, type TimeFormat } from "../../../src/shared/timeFormat";

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

function parseStoredTime(time: string) {
  const [hourText, minuteText] = time.split(":");
  return { hour: Number(hourText), minute: Number(minuteText) };
}

/** Persist the member's 12h/24h preference (call before navigating so hydrate picks it up). */
export async function setTimeFormatPreference(page: Page, timeFormat: TimeFormat) {
  const response = await page.request.put("/api/me/profile", {
    data: { timeFormat },
  });
  expect(response.ok()).toBeTruthy();
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

  const { hour, minute } = parseStoredTime(options.time);
  await dialog.getByTestId("time-picker-trigger").click();
  const popover = page.getByTestId("time-picker-popover");
  await expect(popover).toBeVisible();
  const timeFormat = ((await popover.getAttribute("data-time-format")) ?? "24h") as TimeFormat;

  if (timeFormat === "12h") {
    const { hour12, period } = to12HourClock(hour);
    await popover
      .getByTestId("time-picker-hours")
      .getByRole("option", { name: String(hour12).padStart(2, "0") })
      .click();
    await popover
      .getByTestId("time-picker-minutes")
      .getByRole("option", { name: String(minute).padStart(2, "0") })
      .click();
    await popover.getByTestId(`time-picker-period-${period}`).click();
  } else {
    await popover
      .getByTestId("time-picker-hours")
      .getByRole("option", { name: String(hour).padStart(2, "0") })
      .click();
    await popover
      .getByTestId("time-picker-minutes")
      .getByRole("option", { name: String(minute).padStart(2, "0") })
      .click();
  }

  if (options.duration) {
    await dialog.locator("select").selectOption(options.duration);
  }

  const expected = formatClockTime(hour, minute, timeFormat, "en-US");
  // Intl may insert a narrow no-break space before AM/PM.
  const normalizedExpected = expected.replace(/\s+/g, " ").trim();
  await expect(dialog.getByTestId("time-picker-value")).toHaveText(
    new RegExp(normalizedExpected.replaceAll(" ", "\\s+")),
  );
}
