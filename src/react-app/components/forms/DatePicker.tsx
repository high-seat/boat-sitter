import { useMemo, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { CalendarDays } from "lucide-react";
import { useTranslation } from "react-i18next";
import { DayPicker } from "react-day-picker";
import { getIntlLocale, normalizeLanguageCode } from "@/i18n";
import {
  dayPickerLocales,
  fromIsoDate,
  startOfLocalDay,
  toIsoDate,
  type DayPickerLocaleCode,
} from "@/components/forms/dateIso";
import "react-day-picker/style.css";

export function DatePicker({
  value,
  onChange,
  minDate,
  id,
  "aria-label": ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  minDate?: string;
  id?: string;
  "aria-label"?: string;
}) {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const language = normalizeLanguageCode(i18n.language) as DayPickerLocaleCode;
  const selected = useMemo(() => (value ? fromIsoDate(value) : undefined), [value]);
  const today = useMemo(() => startOfLocalDay(), []);
  const disabledBefore = useMemo(() => (minDate ? fromIsoDate(minDate) : today), [minDate, today]);
  const display = value
    ? new Intl.DateTimeFormat(getIntlLocale(i18n.language), {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(fromIsoDate(value))
    : "";

  return (
    <Popover.Root onOpenChange={setOpen} open={open}>
      <Popover.Trigger asChild>
        <button
          aria-label={ariaLabel}
          className="form-input flex w-full items-center justify-between gap-3 text-left"
          id={id}
          type="button"
        >
          <span className={value ? "font-semibold text-navy" : "text-slate"}>{display}</span>
          <CalendarDays aria-hidden="true" className="shrink-0 text-teal" size={18} />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          className="z-100 w-[min(calc(100vw-2rem),20rem)] rounded-3xl border border-line bg-white p-3 shadow-float data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
          collisionPadding={16}
          sideOffset={8}
        >
          <DayPicker
            animate
            className="boatstead-rdp mx-auto"
            defaultMonth={selected ?? today}
            disabled={{ before: disabledBefore }}
            locale={dayPickerLocales[language] ?? dayPickerLocales["en-US"]}
            mode="single"
            onSelect={(date) => {
              if (!date) return;
              onChange(toIsoDate(date));
              setOpen(false);
            }}
            selected={selected}
            showOutsideDays
          />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
