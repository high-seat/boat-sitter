import { useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useDateTimeFormatter } from "@/hooks/useTimeFormat";
import {
  dayPeriodLabel,
  formatStoredClockTime,
  parseClockTime,
  to12HourClock,
  to24HourClock,
} from "../../../shared/timeFormat";

const HOURS_24 = Array.from({ length: 24 }, (_, index) => index);
const HOURS_12 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const MINUTES = Array.from({ length: 12 }, (_, index) => index * 5);

function snapMinute(minute: number) {
  const snapped = Math.round(minute / 5) * 5;
  return snapped === 60 ? 55 : snapped;
}

export function TimePicker({
  value,
  onChange,
  id,
  "aria-label": ariaLabel,
}: {
  /** Always a 24-hour `HH:mm` value, regardless of the member's display preference. */
  value: string;
  onChange: (value: string) => void;
  id?: string;
  "aria-label"?: string;
}) {
  const { t } = useTranslation();
  const { locale, timeFormat, formatClockTime } = useDateTimeFormatter();
  const [open, setOpen] = useState(false);
  const parsed = parseClockTime(value);
  const hour = parsed.hour;
  const minute = snapMinute(parsed.minute);
  const { hour12, period } = to12HourClock(hour);
  const display = formatClockTime(hour, minute);
  const use12Hour = timeFormat === "12h";

  function commit(nextHour: number, nextMinute: number) {
    onChange(formatStoredClockTime(nextHour, snapMinute(nextMinute)));
  }

  return (
    <Popover.Root onOpenChange={setOpen} open={open}>
      <Popover.Trigger asChild>
        <button
          aria-label={ariaLabel}
          className="form-input flex w-full items-center justify-between gap-3 text-left"
          data-testid="time-picker-trigger"
          id={id}
          type="button"
        >
          <span className="font-semibold text-navy" data-testid="time-picker-value">
            {display}
          </span>
          <Clock aria-hidden="true" className="shrink-0 text-teal" size={18} />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          className={`z-100 rounded-3xl border border-line bg-white p-3 shadow-float data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 ${
            use12Hour ? "w-[min(calc(100vw-2rem),18rem)]" : "w-[min(calc(100vw-2rem),14rem)]"
          }`}
          collisionPadding={16}
          data-testid="time-picker-popover"
          data-time-format={timeFormat}
          sideOffset={8}
        >
          <div className={`grid gap-2 ${use12Hour ? "grid-cols-3" : "grid-cols-2"}`}>
            <div>
              <p className="mb-2 px-1 text-[11px] font-bold uppercase tracking-[0.12em] text-slate">
                {t("applications.videoCall.hour")}
              </p>
              <div
                aria-label={t("applications.videoCall.hour")}
                className="max-h-48 overflow-y-auto rounded-2xl border border-line bg-cream/60 p-1"
                data-testid="time-picker-hours"
                role="listbox"
              >
                {(use12Hour ? HOURS_12 : HOURS_24).map((item) => {
                  const selected = use12Hour ? item === hour12 : item === hour;
                  return (
                    <button
                      aria-selected={selected}
                      className={`flex w-full items-center justify-center rounded-xl px-2 py-1.5 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aqua ${
                        selected
                          ? "bg-teal text-white"
                          : "text-navy hover:bg-seafoam hover:text-teal"
                      }`}
                      key={item}
                      onClick={() => {
                        if (use12Hour) {
                          commit(to24HourClock(item, period), minute);
                          return;
                        }
                        commit(item, minute);
                      }}
                      role="option"
                      type="button"
                    >
                      {String(item).padStart(2, "0")}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <p className="mb-2 px-1 text-[11px] font-bold uppercase tracking-[0.12em] text-slate">
                {t("applications.videoCall.minute")}
              </p>
              <div
                aria-label={t("applications.videoCall.minute")}
                className="max-h-48 overflow-y-auto rounded-2xl border border-line bg-cream/60 p-1"
                data-testid="time-picker-minutes"
                role="listbox"
              >
                {MINUTES.map((item) => {
                  const selected = item === minute;
                  return (
                    <button
                      aria-selected={selected}
                      className={`flex w-full items-center justify-center rounded-xl px-2 py-1.5 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aqua ${
                        selected
                          ? "bg-teal text-white"
                          : "text-navy hover:bg-seafoam hover:text-teal"
                      }`}
                      key={item}
                      onClick={() => {
                        commit(hour, item);
                        if (!use12Hour) setOpen(false);
                      }}
                      role="option"
                      type="button"
                    >
                      {String(item).padStart(2, "0")}
                    </button>
                  );
                })}
              </div>
            </div>
            {use12Hour ? (
              <div>
                <p className="mb-2 px-1 text-[11px] font-bold uppercase tracking-[0.12em] text-slate">
                  {t("applications.videoCall.period")}
                </p>
                <div
                  aria-label={t("applications.videoCall.period")}
                  className="max-h-48 overflow-y-auto rounded-2xl border border-line bg-cream/60 p-1"
                  data-testid="time-picker-period"
                  role="listbox"
                >
                  {(["am", "pm"] as const).map((item) => {
                    const selected = item === period;
                    return (
                      <button
                        aria-selected={selected}
                        className={`flex w-full items-center justify-center rounded-xl px-2 py-1.5 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aqua ${
                          selected
                            ? "bg-teal text-white"
                            : "text-navy hover:bg-seafoam hover:text-teal"
                        }`}
                        data-testid={`time-picker-period-${item}`}
                        key={item}
                        onClick={() => {
                          commit(to24HourClock(hour12, item), minute);
                          setOpen(false);
                        }}
                        role="option"
                        type="button"
                      >
                        {dayPeriodLabel(locale, item)}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
