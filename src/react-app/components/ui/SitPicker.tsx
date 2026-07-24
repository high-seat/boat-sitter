import { useEffect, useId, useRef, useState } from "react";
import { CalendarDays, Check, ChevronDown, MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatSitDates } from "@/dateUtils";
import { getIntlLocale } from "@/i18n";
import { optimizePhotoUrl } from "@/photoUtils";

export type SitPickerOption = {
  id: string;
  boatName: string;
  boatImage: string;
  dateStart: string;
  duration: string;
  location: string;
  country: string;
};

function placeLabel(option: SitPickerOption) {
  return [option.location, option.country].filter((part) => part.trim()).join(", ");
}

function SitOptionContent({
  option,
  compact = false,
}: {
  option: SitPickerOption;
  compact?: boolean;
}) {
  const { i18n, t } = useTranslation();
  const nights = Number.parseInt(option.duration, 10);
  const dateRange = formatSitDates(getIntlLocale(i18n.language), option.dateStart, option.duration);
  const place = placeLabel(option);

  return (
    <div className="flex min-w-0 items-center gap-3 sm:gap-4">
      {option.boatImage ? (
        <img
          alt=""
          className={`shrink-0 rounded-xl object-cover ${compact ? "size-14" : "size-16"}`}
          src={optimizePhotoUrl(option.boatImage, 320)}
        />
      ) : (
        <span
          aria-hidden="true"
          className={`grid shrink-0 place-items-center rounded-xl bg-seafoam text-teal ${compact ? "size-14" : "size-16"}`}
        >
          <CalendarDays size={compact ? 20 : 24} />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-base font-bold text-navy sm:text-lg">
          {option.boatName}
        </p>
        <p className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold text-teal">
          <CalendarDays aria-hidden="true" className="shrink-0" size={14} />
          <span className="truncate">{dateRange}</span>
          {Number.isFinite(nights) && nights >= 0 ? (
            <span className="shrink-0 font-normal text-slate">
              · {t("duration.nights", { count: nights })}
            </span>
          ) : null}
        </p>
        {place ? (
          <p className="mt-1 flex items-center gap-1.5 truncate text-sm text-slate">
            <MapPin aria-hidden="true" className="shrink-0" size={14} />
            <span className="truncate">{place}</span>
          </p>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Rich trip/sit picker: shows a boat image, formatted dates, nights, and place
 * for each open sit. Renders a static card when there is only one option and a
 * listbox dropdown when the owner has several matching sits to choose from.
 */
export function SitPicker({
  sits,
  value,
  onChange,
  label,
  testId = "sit-picker",
}: {
  sits: SitPickerOption[];
  value: string;
  onChange: (sitId: string) => void;
  label: string;
  testId?: string;
}) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const selected = sits.find((sit) => sit.id === value) ?? sits[0];

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!selected) return null;

  if (sits.length === 1) {
    return (
      <div data-testid={testId}>
        <span className="mb-1.5 block text-sm font-semibold text-navy" id={`${listId}-label`}>
          {label}
        </span>
        <div className="rounded-2xl border border-line bg-cream/50 p-3 sm:p-4">
          <SitOptionContent option={selected} />
        </div>
      </div>
    );
  }

  return (
    <div data-testid={testId} ref={rootRef}>
      <span className="mb-1.5 block text-sm font-semibold text-navy" id={`${listId}-label`}>
        {label}
      </span>
      <div className="relative">
        <button
          aria-controls={listId}
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-labelledby={`${listId}-label`}
          className="flex w-full items-center gap-3 rounded-2xl border border-line bg-white p-3 text-left shadow-sm outline-none transition hover:border-teal focus-visible:border-teal sm:p-4"
          data-testid={`${testId}-trigger`}
          onClick={() => setOpen((current) => !current)}
          type="button"
        >
          <div className="min-w-0 flex-1">
            <SitOptionContent compact option={selected} />
          </div>
          <ChevronDown
            aria-hidden="true"
            className={`shrink-0 text-slate transition ${open ? "rotate-180" : ""}`}
            size={20}
          />
        </button>
        {open ? (
          <ul
            aria-labelledby={`${listId}-label`}
            className="absolute z-30 mt-2 max-h-80 w-full overflow-y-auto rounded-2xl border border-line bg-white p-2 shadow-float"
            id={listId}
            role="listbox"
          >
            {sits.map((sit) => {
              const isSelected = sit.id === selected.id;
              return (
                <li key={sit.id} role="none">
                  <button
                    aria-selected={isSelected}
                    className={`flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition ${
                      isSelected ? "bg-seafoam" : "hover:bg-cream"
                    }`}
                    data-testid={`${testId}-option-${sit.id}`}
                    onClick={() => {
                      onChange(sit.id);
                      setOpen(false);
                    }}
                    role="option"
                    type="button"
                  >
                    <div className="min-w-0 flex-1">
                      <SitOptionContent compact option={sit} />
                    </div>
                    {isSelected ? (
                      <Check aria-hidden="true" className="shrink-0 text-teal" size={18} />
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
