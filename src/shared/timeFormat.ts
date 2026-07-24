export type TimeFormat = "12h" | "24h";

/** Regions that commonly prefer 12-hour clocks when Intl probing fails. */
const TWELVE_HOUR_REGIONS = new Set([
  "US",
  "CA",
  "AU",
  "NZ",
  "PH",
  "IN",
  "PK",
  "BD",
  "EG",
  "SA",
  "MX",
  "CO",
  "VE",
  "MY",
  "SG",
  "IE",
]);

/**
 * Prefer the locale's default clock via Intl. Fall back to region, then language
 * (e.g. English → 12h, German → 24h).
 */
export function detectTimeFormat(localeHint?: string): TimeFormat {
  const locale =
    localeHint?.trim() ||
    (typeof navigator !== "undefined"
      ? (navigator.languages?.[0] ?? navigator.language)
      : undefined);
  if (!locale) return "24h";

  try {
    const maximized = new Intl.Locale(locale).maximize();
    const hourCycle =
      maximized.hourCycle ??
      (typeof (maximized as Intl.Locale & { getHourCycles?: () => string[] }).getHourCycles ===
      "function"
        ? (maximized as Intl.Locale & { getHourCycles: () => string[] }).getHourCycles()[0]
        : undefined);
    if (hourCycle === "h12" || hourCycle === "h11") return "12h";
    if (hourCycle === "h23" || hourCycle === "h24") return "24h";

    const parts = new Intl.DateTimeFormat(maximized.toString(), {
      hour: "numeric",
    }).formatToParts(new Date(2020, 0, 1, 15));
    if (parts.some((part) => part.type === "dayPeriod")) return "12h";
    return "24h";
  } catch {
    try {
      const region = new Intl.Locale(locale).maximize().region;
      if (region && TWELVE_HOUR_REGIONS.has(region)) return "12h";
    } catch {
      // ignore
    }
    const lang = locale.toLowerCase().split("-")[0];
    if (lang === "en") return "12h";
    return "24h";
  }
}

export function timeFormatHour12(timeFormat: TimeFormat): boolean {
  return timeFormat === "12h";
}

/** Merge hour12 into Intl options from the user's time-format preference. */
export function withTimeFormat(
  timeFormat: TimeFormat,
  options: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormatOptions {
  return { ...options, hour12: timeFormatHour12(timeFormat) };
}

/** Format a Date/ISO string with the user's preferred clock. */
export function formatDateTime(
  value: Date | string | number,
  locale: string,
  timeFormat: TimeFormat,
  options: Intl.DateTimeFormatOptions,
): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(locale, withTimeFormat(timeFormat, options)).format(date);
}

/** Display a stored 24h `HH:mm` value for the user's preferred clock. */
export function formatClockTime(
  hour: number,
  minute: number,
  timeFormat: TimeFormat,
  locale: string,
): string {
  return formatDateTime(new Date(2020, 0, 1, hour, minute), locale, timeFormat, {
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Localized AM/PM (or equivalent) label for the given locale. */
export function dayPeriodLabel(locale: string, period: "am" | "pm"): string {
  const hour = period === "am" ? 9 : 15;
  const parts = new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    hour12: true,
  }).formatToParts(new Date(2020, 0, 1, hour));
  return parts.find((part) => part.type === "dayPeriod")?.value ?? (period === "am" ? "AM" : "PM");
}

export function to12HourClock(hour24: number): { hour12: number; period: "am" | "pm" } {
  const period: "am" | "pm" = hour24 < 12 ? "am" : "pm";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return { hour12, period };
}

export function to24HourClock(hour12: number, period: "am" | "pm"): number {
  const normalized = ((hour12 - 1) % 12) + 1;
  if (period === "am") return normalized === 12 ? 0 : normalized;
  return normalized === 12 ? 12 : normalized + 12;
}

/** Parse a stored 24h `HH:mm` string into hour/minute parts. */
export function parseClockTime(value: string): { hour: number; minute: number } {
  const match = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(value.trim());
  if (!match) return { hour: 10, minute: 0 };
  return {
    hour: Number(match[1]),
    minute: Number(match[2]),
  };
}

/** True when `value` is a 24-hour `HH:mm` clock string (00:00–23:59). */
export function is24HourClockTime(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value.trim());
}

/**
 * Canonical wall-clock storage form: always 24-hour `HH:mm`.
 * Display (12h vs 24h) is applied only when rendering.
 */
export function formatStoredClockTime(hour: number, minute: number): string {
  const safeHour = Math.min(23, Math.max(0, Math.trunc(hour)));
  const safeMinute = Math.min(59, Math.max(0, Math.trunc(minute)));
  return `${String(safeHour).padStart(2, "0")}:${String(safeMinute).padStart(2, "0")}`;
}
