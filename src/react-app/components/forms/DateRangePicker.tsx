import { useMemo, useState, type MouseEvent } from "react";
import * as Popover from "@radix-ui/react-popover";
import { de, el, enGB, enUS, es, fr, hr, it, nl, pt, tr } from "date-fns/locale";
import { CalendarDays, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { DayPicker, type DateRange } from "react-day-picker";
import { getIntlLocale, normalizeLanguageCode } from "@/i18n";
import "react-day-picker/style.css";

const toIso = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const fromIso = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const locales = { "en-US": enUS, "en-GB": enGB, fr, es, it, de, nl, pt, el, hr, tr };

export function DateRangePicker({
  startDate,
  endDate,
  onChange,
  variant = "home",
}: {
  startDate: string;
  endDate: string;
  onChange: (range: { startDate: string; endDate: string }) => void;
  variant?: "home" | "browse";
}) {
  const { i18n, t } = useTranslation();
  const [open, setOpen] = useState(false);
  const language = normalizeLanguageCode(i18n.language) as keyof typeof locales;
  const displayDate = (value: string) =>
    new Intl.DateTimeFormat(getIntlLocale(i18n.language), {
      day: "numeric",
      month: "short",
    }).format(fromIso(value));
  const selected = useMemo<DateRange | undefined>(
    () =>
      startDate || endDate
        ? {
            from: startDate ? fromIso(startDate) : undefined,
            to: endDate ? fromIso(endDate) : undefined,
          }
        : undefined,
    [endDate, startDate],
  );
  const today = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);
  const hasDates = Boolean(startDate || endDate);
  const label =
    startDate && endDate
      ? `${displayDate(startDate)} – ${displayDate(endDate)}`
      : startDate
        ? displayDate(startDate)
        : t("search.anyDates");

  function clear(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    onChange({ startDate: "", endDate: "" });
  }

  return (
    <div
      className={
        variant === "home"
          ? "flex items-center gap-2 border-b border-line px-5 py-4 md:border-r md:border-b-0"
          : "flex min-w-56 items-center gap-1 rounded-xl border border-line bg-white"
      }
    >
      <Popover.Root onOpenChange={setOpen} open={open}>
        <Popover.Trigger asChild>
          <button
            className={`flex min-w-0 flex-1 items-center gap-3 text-left outline-none ${
              variant === "browse" ? "px-4 py-3" : ""
            }`}
            type="button"
          >
            <CalendarDays
              className={variant === "home" ? "shrink-0 text-coral" : "shrink-0 text-teal"}
              size={19}
            />
            <span className="min-w-0 flex-1">
              {variant === "home" && (
                <span className="block text-[11px] font-bold uppercase tracking-[0.13em] text-slate">
                  {t("search.dates")}
                </span>
              )}
              <span
                className={`block truncate text-sm ${hasDates ? "font-semibold text-navy" : "text-slate"}`}
              >
                {label}
              </span>
            </span>
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            align="start"
            className="z-70 w-[min(calc(100vw-2rem),20rem)] rounded-3xl border border-line bg-white p-3 shadow-float data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
            collisionPadding={16}
            sideOffset={8}
          >
            <div className="mb-3">
              <p className="font-display text-sm font-bold text-navy">{t("search.chooseDates")}</p>
              <p className="mt-0.5 text-xs text-slate">{t("search.chooseDatesHint")}</p>
            </div>
            <DayPicker
              animate
              className="boatstead-rdp mx-auto"
              defaultMonth={selected?.from ?? today}
              disabled={{ before: today }}
              locale={locales[language]}
              mode="range"
              numberOfMonths={1}
              onSelect={(range) => {
                onChange({
                  startDate: range?.from ? toIso(range.from) : "",
                  endDate: range?.to ? toIso(range.to) : "",
                });
                if (range?.from && range?.to) setOpen(false);
              }}
              selected={selected}
              showOutsideDays
            />
            <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
              <button
                className="text-xs font-bold text-slate hover:text-navy disabled:opacity-40"
                disabled={!hasDates}
                onClick={clear}
                type="button"
              >
                {t("search.clearDates")}
              </button>
              <p className="text-xs text-slate">{t("search.changeLater")}</p>
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
      {hasDates && (
        <button
          aria-label={t("search.clearDates")}
          className="mr-2 grid size-7 shrink-0 place-items-center rounded-full text-slate hover:bg-cream hover:text-navy"
          onClick={clear}
          type="button"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
