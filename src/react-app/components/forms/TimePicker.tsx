import { useMemo, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { Clock } from "lucide-react";
import { useTranslation } from "react-i18next";

const HOURS = Array.from({ length: 24 }, (_, index) => index);
const MINUTES = Array.from({ length: 12 }, (_, index) => index * 5);

function parseTime(value: string) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value);
  if (!match) return { hour: 10, minute: 0 };
  return {
    hour: Math.min(23, Math.max(0, Number(match[1]))),
    minute: Math.min(59, Math.max(0, Number(match[2]))),
  };
}

function formatTime(hour: number, minute: number) {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

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
  value: string;
  onChange: (value: string) => void;
  id?: string;
  "aria-label"?: string;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const parsed = useMemo(() => parseTime(value), [value]);
  const hour = parsed.hour;
  const minute = snapMinute(parsed.minute);
  const display = formatTime(hour, minute);

  function commit(nextHour: number, nextMinute: number) {
    onChange(formatTime(nextHour, snapMinute(nextMinute)));
  }

  return (
    <Popover.Root onOpenChange={setOpen} open={open}>
      <Popover.Trigger asChild>
        <button
          aria-label={ariaLabel}
          className="form-input flex w-full items-center justify-between gap-3 text-left"
          id={id}
          type="button"
        >
          <span className="font-semibold text-navy">{display}</span>
          <Clock aria-hidden="true" className="shrink-0 text-teal" size={18} />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          className="z-80 w-[min(calc(100vw-2rem),14rem)] rounded-3xl border border-line bg-white p-3 shadow-float data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
          collisionPadding={16}
          sideOffset={8}
        >
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="mb-2 px-1 text-[11px] font-bold uppercase tracking-[0.12em] text-slate">
                {t("applications.videoCall.hour")}
              </p>
              <div
                aria-label={t("applications.videoCall.hour")}
                className="max-h-48 overflow-y-auto rounded-2xl border border-line bg-cream/60 p-1"
                role="listbox"
              >
                {HOURS.map((item) => {
                  const selected = item === hour;
                  return (
                    <button
                      aria-selected={selected}
                      className={`flex w-full items-center justify-center rounded-xl px-2 py-1.5 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aqua ${
                        selected
                          ? "bg-teal text-white"
                          : "text-navy hover:bg-seafoam hover:text-teal"
                      }`}
                      key={item}
                      onClick={() => commit(item, minute)}
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
                        setOpen(false);
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
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
