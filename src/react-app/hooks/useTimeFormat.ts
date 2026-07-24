import { getIntlLocale } from "@/i18n";
import { detectTimeFormat, useAppStore, type TimeFormat } from "@/store";
import { formatClockTime, formatDateTime, withTimeFormat } from "../../shared/timeFormat";
import { useTranslation } from "react-i18next";

/**
 * Member time-format preference (12h/24h), falling back to locale detection
 * when signed out or unset.
 */
export function useTimeFormat(): TimeFormat {
  return useAppStore((state) => state.user?.timeFormat) ?? detectTimeFormat();
}

/** Intl helpers bound to the active language + preferred clock. */
export function useDateTimeFormatter() {
  const { i18n } = useTranslation();
  const timeFormat = useTimeFormat();
  const locale = getIntlLocale(i18n.language);

  return {
    locale,
    timeFormat,
    formatDateTime: (value: Date | string | number, options: Intl.DateTimeFormatOptions) =>
      formatDateTime(value, locale, timeFormat, options),
    formatClockTime: (hour: number, minute: number) =>
      formatClockTime(hour, minute, timeFormat, locale),
    withTimeFormat: (options: Intl.DateTimeFormatOptions) => withTimeFormat(timeFormat, options),
  };
}
