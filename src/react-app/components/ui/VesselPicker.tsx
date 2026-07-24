import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown, MapPin, ShipWheel } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatBoatLength } from "@/lengthUtils";
import type { Vessel } from "@/mockApi";
import { FormLabel } from "@/components/ui/FormLabel";
import { optimizePhotoUrl } from "@/photoUtils";
import { detectMeasurementSystem, useAppStore } from "@/store";

const VESSEL_TYPE_KEYS: Record<string, string> = {
  "Sailing yacht": "vessel.sailingYacht",
  Catamaran: "vessel.catamaran",
  "Motor yacht": "vessel.motorYacht",
  Narrowboat: "vessel.narrowboat",
  Trawler: "vessel.trawler",
  Houseboat: "vessel.houseboat",
  "Narrowboat / houseboat": "vessel.narrowboatHouseboat",
};

function vesselTypeLabel(t: (key: string) => string, type: string) {
  const key = VESSEL_TYPE_KEYS[type];
  return key ? t(key) : type;
}

function VesselOptionContent({ vessel, compact = false }: { vessel: Vessel; compact?: boolean }) {
  const { t } = useTranslation();
  const measurementSystem =
    useAppStore((state) => state.user?.measurementSystem) ?? detectMeasurementSystem();
  const typeLabel = vesselTypeLabel(t, vessel.type).trim();
  const lengthLabel = formatBoatLength(vessel.length, measurementSystem).trim();
  const typeLengthLine = [typeLabel, lengthLabel].filter(Boolean).join(" · ");

  return (
    <div className={`flex min-w-0 items-center gap-3 ${compact ? "" : "gap-4"}`}>
      <img
        alt={t("boat.imageAlt", { name: vessel.name, type: typeLabel })}
        className={`shrink-0 rounded-xl object-cover ${compact ? "size-14" : "size-16 sm:size-18"}`}
        src={optimizePhotoUrl(vessel.image, 320)}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-base font-bold text-navy sm:text-lg">
          {vessel.name}
        </p>
        <p className="mt-0.5 text-xs font-semibold uppercase tracking-wider text-teal">
          {typeLengthLine}
        </p>
        <p className="mt-1 flex items-center gap-1.5 truncate text-sm text-slate">
          <MapPin aria-hidden="true" className="shrink-0" size={14} />
          <span className="truncate">{vessel.homePort}</span>
        </p>
      </div>
    </div>
  );
}

function FilterVesselThumb({ vessel }: { vessel: Vessel }) {
  const { t } = useTranslation();
  return (
    <img
      alt={t("boat.imageAlt", {
        name: vessel.name,
        type: vesselTypeLabel(t, vessel.type),
      })}
      className="size-7 shrink-0 rounded-md object-cover"
      src={optimizePhotoUrl(vessel.image, 96)}
    />
  );
}

export function VesselPicker({
  vessels,
  value,
  onChange,
  disabled = false,
  variant = "form",
  allowAll = false,
  allValue = "",
  label,
  testId,
}: {
  vessels: Vessel[];
  value: string;
  onChange: (boatId: string) => void;
  disabled?: boolean;
  /** `form` is the sit editor control; `filter` is the compact list filter. */
  variant?: "form" | "filter";
  /** When true, value may be `allValue` to mean every boat. */
  allowAll?: boolean;
  allValue?: string;
  label?: string;
  testId?: string;
}) {
  const { t } = useTranslation();
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const selected = vessels.find((vessel) => vessel.id === value);
  const isAllSelected = allowAll && value === allValue;
  const singleBoat = vessels.length === 1;
  const fieldLabel =
    label ?? (variant === "filter" ? t("owner.sitBoatFilter") : t("sitEditor.boat"));
  const resolvedTestId =
    testId ?? (variant === "filter" ? "vessel-picker-filter" : "vessel-picker");

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

  if (vessels.length === 0) return null;

  if (variant === "filter") {
    const canOpen = !disabled && (allowAll || vessels.length > 1);
    return (
      <div className="relative" data-testid={resolvedTestId} ref={rootRef}>
        <button
          aria-controls={listId}
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-label={fieldLabel}
          className="flex max-w-full items-center gap-2 rounded-xl border border-line bg-white px-3 py-2 text-left text-sm font-semibold text-navy outline-none transition hover:border-teal focus-visible:border-teal disabled:opacity-60"
          disabled={!canOpen}
          onClick={() => {
            if (!canOpen) return;
            setOpen((current) => !current);
          }}
          type="button"
        >
          {isAllSelected || !selected ? (
            <span
              aria-hidden="true"
              className="grid size-7 shrink-0 place-items-center rounded-md bg-seafoam text-teal"
            >
              <ShipWheel size={16} />
            </span>
          ) : (
            <FilterVesselThumb vessel={selected} />
          )}
          <span className="min-w-0 truncate">
            {isAllSelected || !selected ? t("owner.sitBoatFilterAll") : selected.name}
          </span>
          {canOpen ? (
            <ChevronDown
              aria-hidden="true"
              className={`shrink-0 text-slate transition ${open ? "rotate-180" : ""}`}
              size={16}
            />
          ) : null}
        </button>
        {open && canOpen ? (
          <ul
            aria-label={fieldLabel}
            className="absolute right-0 z-30 mt-2 max-h-72 min-w-64 overflow-y-auto rounded-2xl border border-line bg-white p-2 shadow-float"
            id={listId}
            role="listbox"
          >
            {allowAll ? (
              <li role="none">
                <button
                  aria-selected={isAllSelected}
                  className={`flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left text-sm font-semibold transition ${
                    isAllSelected ? "bg-seafoam text-navy" : "text-navy hover:bg-cream"
                  }`}
                  data-testid="vessel-picker-option-all"
                  onClick={() => {
                    onChange(allValue);
                    setOpen(false);
                  }}
                  role="option"
                  type="button"
                >
                  <span
                    aria-hidden="true"
                    className="grid size-7 shrink-0 place-items-center rounded-md bg-cream text-teal"
                  >
                    <ShipWheel size={16} />
                  </span>
                  <span className="min-w-0 flex-1 truncate">{t("owner.sitBoatFilterAll")}</span>
                  {isAllSelected ? (
                    <Check aria-hidden="true" className="shrink-0 text-teal" size={16} />
                  ) : null}
                </button>
              </li>
            ) : null}
            {vessels.map((vessel) => {
              const isSelected = !isAllSelected && vessel.id === value;
              return (
                <li key={vessel.id} role="none">
                  <button
                    aria-selected={isSelected}
                    className={`flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left text-sm font-semibold transition ${
                      isSelected ? "bg-seafoam text-navy" : "text-navy hover:bg-cream"
                    }`}
                    data-testid={`vessel-picker-option-${vessel.id}`}
                    onClick={() => {
                      onChange(vessel.id);
                      setOpen(false);
                    }}
                    role="option"
                    type="button"
                  >
                    <FilterVesselThumb vessel={vessel} />
                    <span className="min-w-0 flex-1 truncate">{vessel.name}</span>
                    {isSelected ? (
                      <Check aria-hidden="true" className="shrink-0 text-teal" size={16} />
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
    );
  }

  const formSelected = selected ?? vessels[0];
  if (!formSelected) return null;

  const canChoose = !disabled && vessels.length > 1;

  if (!canChoose) {
    return (
      <div data-testid={resolvedTestId}>
        <FormLabel required>{fieldLabel}</FormLabel>
        <div className="rounded-2xl border border-line bg-cream/50 p-3 sm:p-4">
          <VesselOptionContent vessel={formSelected} />
          {singleBoat && !disabled && (
            <p className="mt-3 text-xs leading-5 text-slate">{t("sitEditor.boatOnlySelected")}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div data-testid={resolvedTestId} ref={rootRef}>
      <FormLabel id={`${listId}-label`} required>
        {fieldLabel}
      </FormLabel>
      <div className="relative">
        <button
          aria-controls={listId}
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-labelledby={`${listId}-label`}
          className="flex w-full items-center gap-3 rounded-2xl border border-line bg-white p-3 text-left shadow-sm outline-none transition hover:border-teal focus-visible:border-teal sm:p-4"
          onClick={() => setOpen((current) => !current)}
          type="button"
        >
          <div className="min-w-0 flex-1">
            <VesselOptionContent compact vessel={formSelected} />
          </div>
          <ChevronDown
            aria-hidden="true"
            className={`shrink-0 text-slate transition ${open ? "rotate-180" : ""}`}
            size={20}
          />
        </button>
        {open && (
          <ul
            aria-labelledby={`${listId}-label`}
            className="absolute z-20 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border border-line bg-white p-2 shadow-float"
            id={listId}
            role="listbox"
          >
            {vessels.map((vessel) => {
              const isSelected = vessel.id === formSelected.id;
              return (
                <li key={vessel.id} role="none">
                  <button
                    aria-selected={isSelected}
                    className={`flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition ${
                      isSelected ? "bg-seafoam" : "hover:bg-cream"
                    }`}
                    data-testid={`vessel-picker-option-${vessel.id}`}
                    onClick={() => {
                      onChange(vessel.id);
                      setOpen(false);
                    }}
                    role="option"
                    type="button"
                  >
                    <div className="min-w-0 flex-1">
                      <VesselOptionContent compact vessel={vessel} />
                    </div>
                    {isSelected && (
                      <Check aria-hidden="true" className="shrink-0 text-teal" size={18} />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
