import { useState } from "react";
import { Images, MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PhotoLightbox } from "@/components/ui/PhotoLightbox";
import { formatBoatLength } from "@/lengthUtils";
import type { BoatPhoto } from "@/mockApi";
import { coverPhotoClassName, coverPhotoStyle, optimizePhotoUrl } from "@/photoUtils";
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

export type VesselSummaryFields = {
  name: string;
  type: string;
  length: string;
  yearBuilt?: number | null;
  homePort: string;
  image: string;
  gallery?: BoatPhoto[];
  engineType: string;
  voltageType: string;
  stoveFuelType: string;
};

/** Interactive vessel summary: cover opens the photo lightbox when photos exist. */
export function VesselSummaryCard({
  vessel,
  testId = "vessel-summary-card",
}: {
  vessel: VesselSummaryFields;
  testId?: string;
}) {
  const { t } = useTranslation();
  const measurementSystem =
    useAppStore((state) => state.user?.measurementSystem) ?? detectMeasurementSystem();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const name = vessel.name.trim() || t("editorPreview.untitledBoat");
  const hasHomePort = Boolean(vessel.homePort.trim());
  const homePortLabel = hasHomePort
    ? t("detail.homePort", { homePort: vessel.homePort.trim() })
    : t("editorPreview.locationUnknown");
  const coverUrl = vessel.image.trim() || FALLBACK_IMAGE;
  const photos: BoatPhoto[] = [{ url: coverUrl }, ...(vessel.gallery ?? [])].filter(
    (photo, index, list) => list.findIndex((entry) => entry.url === photo.url) === index,
  );
  const hasGallery = photos.length > 1;

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
    <>
      <article
        className="flex max-w-full min-w-0 flex-col gap-5 overflow-hidden rounded-2xl border border-line bg-white p-4 shadow-card sm:flex-row sm:items-center"
        data-testid={testId}
      >
        <button
          aria-label={t("lightbox.dialogLabel", { boat: name })}
          className="relative aspect-2/1 w-full shrink-0 overflow-hidden rounded-xl bg-seafoam transition hover:opacity-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal sm:size-32 sm:aspect-auto"
          data-testid={`${testId}-cover`}
          onClick={() => setLightboxIndex(0)}
          type="button"
        >
          <img
            alt={t("boat.imageAlt", { name, type: typeLabel || vessel.type })}
            className={coverPhotoClassName()}
            onError={(event) => {
              event.currentTarget.src = FALLBACK_IMAGE;
            }}
            src={optimizePhotoUrl(coverUrl, 480)}
            style={coverPhotoStyle(photos[0])}
          />
          {hasGallery ? (
            <span
              className="absolute right-2 bottom-2 flex items-center gap-1 rounded-full bg-navy/80 px-2 py-1 text-[11px] font-bold text-white"
              data-testid={`${testId}-photo-count`}
            >
              <Images aria-hidden="true" size={12} />
              <span>{photos.length}</span>
            </span>
          ) : null}
        </button>
        <div className="min-w-0 flex-1 overflow-hidden">
          {specsLine ? (
            <p
              className="truncate text-xs font-bold uppercase tracking-wider text-teal"
              data-testid={`${testId}-specs`}
            >
              {specsLine}
            </p>
          ) : null}
          <p
            className="mt-1 truncate font-display text-xl font-bold text-navy"
            data-testid={`${testId}-name`}
            title={name}
          >
            {name}
          </p>
          <p className="mt-1 flex min-w-0 items-center gap-1.5 text-sm text-slate">
            <MapPin aria-hidden="true" className="shrink-0" size={14} />
            <span className="truncate" data-testid={`${testId}-location`} title={homePortLabel}>
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
      {lightboxIndex != null ? (
        <PhotoLightbox
          boatName={name}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onIndexChange={setLightboxIndex}
          photos={photos}
        />
      ) : null}
    </>
  );
}
