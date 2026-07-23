import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown, MapPin } from "lucide-react";
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
  const typeLabel = vesselTypeLabel(t, vessel.type);
  const lengthLabel = formatBoatLength(vessel.length, measurementSystem);

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
          {typeLabel} · {lengthLabel}
        </p>
        <p className="mt-1 flex items-center gap-1.5 truncate text-sm text-slate">
          <MapPin aria-hidden="true" className="shrink-0" size={14} />
          <span className="truncate">{vessel.homePort}</span>
        </p>
      </div>
    </div>
  );
}

export function VesselPicker({
  vessels,
  value,
  onChange,
  disabled = false,
}: {
  vessels: Vessel[];
  value: string;
  onChange: (boatId: string) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const selected = vessels.find((vessel) => vessel.id === value) ?? vessels[0];
  const singleBoat = vessels.length === 1;
  const canChoose = !disabled && vessels.length > 1;

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

  if (!canChoose) {
    return (
      <div>
        <FormLabel required>{t("sitEditor.boat")}</FormLabel>
        <div className="rounded-2xl border border-line bg-cream/50 p-3 sm:p-4">
          <VesselOptionContent vessel={selected} />
          {singleBoat && !disabled && (
            <p className="mt-3 text-xs leading-5 text-slate">{t("sitEditor.boatOnlySelected")}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div ref={rootRef}>
      <FormLabel id={`${listId}-label`} required>
        {t("sitEditor.boat")}
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
            <VesselOptionContent compact vessel={selected} />
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
              const isSelected = vessel.id === selected.id;
              return (
                <li key={vessel.id} role="none">
                  <button
                    aria-selected={isSelected}
                    className={`flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition ${
                      isSelected ? "bg-seafoam" : "hover:bg-cream"
                    }`}
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
