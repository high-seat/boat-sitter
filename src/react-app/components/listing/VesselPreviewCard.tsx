import { MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatBoatLength } from "@/lengthUtils";
import { optimizePhotoUrl } from "@/photoUtils";
import { detectMeasurementSystem, useAppStore } from "@/store";

const LABEL_KEYS: Record<string, string> = {
  "Sailing yacht": "vessel.sailingYacht",
  Catamaran: "vessel.catamaran",
  "Motor yacht": "vessel.motorYacht",
  Narrowboat: "vessel.narrowboat",
  Trawler: "vessel.trawler",
  Houseboat: "vessel.houseboat",
  "Narrowboat / houseboat": "vessel.narrowboatHouseboat",
  "Not specified": "engine.notSpecified",
  "No engine": "engine.none",
  "Inboard diesel": "engine.inboardDiesel",
  "Inboard gasoline": "engine.inboardGasoline",
  "Outboard gasoline": "engine.outboardGasoline",
  "Inboard electric": "engine.inboardElectric",
  "Outboard electric": "engine.outboardElectric",
  Hybrid: "engine.hybrid",
  "No stove": "stove.none",
  "Electric / induction": "stove.electric",
  "LPG / propane": "stove.lpg",
  Butane: "stove.butane",
  Diesel: "stove.diesel",
  Alcohol: "stove.alcohol",
  Kerosene: "stove.kerosene",
};

const FALLBACK_IMAGE =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400" viewBox="0 0 640 400"><rect fill="#d7ebe6" width="640" height="400"/><text x="50%" y="50%" fill="#2a6f6a" font-family="system-ui,sans-serif" font-size="22" text-anchor="middle" dominant-baseline="middle">Boatstead</text></svg>`,
  );

function labelFor(t: (key: string) => string, value: string) {
  const key = LABEL_KEYS[value];
  return key ? t(key) : value;
}

export type VesselPreviewFields = {
  name: string;
  type: string;
  /** Stored length string (e.g. "12.5 m"), or empty while unset. */
  length: string;
  yearBuilt?: number | null;
  homePort: string;
  image: string;
  engineType: string;
  voltageType: string;
  stoveFuelType: string;
};

/** Non-interactive vessel summary matching the owner boats list row. */
export function VesselPreviewCard({ vessel }: { vessel: VesselPreviewFields }) {
  const { t } = useTranslation();
  const measurementSystem =
    useAppStore((state) => state.user?.measurementSystem) ?? detectMeasurementSystem();
  const name = vessel.name.trim() || t("editorPreview.untitledBoat");
  const hasHomePort = Boolean(vessel.homePort.trim());
  const homePortLabel = hasHomePort
    ? t("detail.homePort", { homePort: vessel.homePort.trim() })
    : t("editorPreview.locationUnknown");
  const image = vessel.image.trim() || FALLBACK_IMAGE;
  const specsParts: string[] = [];
  const typeLabel = labelFor(t, vessel.type).trim();
  if (typeLabel && vessel.type !== "Not specified") {
    specsParts.push(typeLabel);
  }
  const lengthLabel = vessel.length.trim()
    ? formatBoatLength(vessel.length, measurementSystem).trim()
    : "";
  if (lengthLabel) {
    specsParts.push(lengthLabel);
  }
  if (vessel.yearBuilt != null) {
    specsParts.push(t("boat.yearBuiltShort", { year: vessel.yearBuilt }));
  }
  const specsLine = specsParts.join(" · ");

  return (
    <div className="min-w-0">
      <article className="pointer-events-none flex max-w-full min-w-0 select-none flex-col gap-5 overflow-hidden rounded-2xl border border-line bg-white p-4 shadow-card sm:flex-row sm:items-center">
        <img
          alt=""
          className="aspect-2/1 w-full shrink-0 rounded-xl object-cover sm:size-32"
          onError={(event) => {
            event.currentTarget.src = FALLBACK_IMAGE;
          }}
          src={optimizePhotoUrl(image, 480)}
        />
        <div className="min-w-0 flex-1 overflow-hidden">
          <p
            className="truncate text-xs font-bold uppercase tracking-wider text-teal"
            data-testid="vessel-preview-type-length"
          >
            {specsLine}
          </p>
          <p
            className="mt-1 truncate font-display text-xl font-bold text-navy"
            data-testid="vessel-preview-name"
            title={name}
          >
            {name}
          </p>
          <p className="mt-1 flex min-w-0 items-center gap-1.5 text-sm text-slate">
            <MapPin aria-hidden="true" className="shrink-0" size={14} />
            <span className="truncate" data-testid="vessel-preview-location" title={homePortLabel}>
              {homePortLabel}
            </span>
          </p>
          <p className="mt-1 truncate text-xs text-slate">
            {t("owner.engineSummary", { engine: labelFor(t, vessel.engineType) })}
          </p>
          <p className="mt-1 truncate text-xs text-slate">
            {t("owner.voltageSummary", { voltage: labelFor(t, vessel.voltageType) })}
          </p>
          <p className="mt-1 truncate text-xs text-slate">
            {t("owner.stoveSummary", { fuel: labelFor(t, vessel.stoveFuelType) })}
          </p>
        </div>
      </article>
      <p
        className="mt-3 text-xs leading-5 text-slate"
        data-testid="vessel-preview-length-unit-hint"
      >
        {t("editorPreview.lengthUnitHint")}
      </p>
    </div>
  );
}
