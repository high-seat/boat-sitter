import { useEffect, useMemo, useRef } from "react";
import { divIcon, latLngBounds } from "leaflet";
import { ExternalLink, MapPin } from "lucide-react";
import { MapContainer, Marker, Popup, TileLayer, useMap, ZoomControl } from "react-leaflet";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "leaflet/dist/leaflet.css";
import type { Boat } from "@/mockApi";
import { formatMapLocationLabel, isApproximateMapPin, mapsSearchUrl } from "@/mapUtils";

const markerIcon = divIcon({
  className: "boatstead-map-marker",
  html: '<span style="display:grid;width:38px;height:38px;place-items:center;border:3px solid white;border-radius:999px;background:#ef7057;color:white;font-size:18px;box-shadow:0 5px 18px rgba(7,48,66,.28)">⚓</span>',
  iconAnchor: [19, 19],
  iconSize: [38, 38],
  popupAnchor: [0, -20],
});

function MapViewport({ boats, fitKey }: { boats: Boat[]; fitKey: string }) {
  const map = useMap();
  const fittedKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!boats.length) return;
    if (boats.length === 1) {
      map.setView([boats[0].latitude, boats[0].longitude], 12);
      fittedKeyRef.current = fitKey;
      return;
    }
    const bounds = latLngBounds(
      boats.map((boat) => [boat.latitude, boat.longitude] as [number, number]),
    );
    const isNewSearch = fittedKeyRef.current !== fitKey;
    if (isNewSearch) {
      fittedKeyRef.current = fitKey;
      map.fitBounds(bounds, { maxZoom: 10, padding: [45, 45] });
      return;
    }
    const current = map.getBounds();
    const needsExpand = boats.some((boat) => !current.contains([boat.latitude, boat.longitude]));
    if (needsExpand) {
      map.fitBounds(bounds, { maxZoom: 10, padding: [45, 45], animate: false });
    }
  }, [boats, fitKey, map]);

  return null;
}

function SitMapFooter({ boat }: { boat: Boat }) {
  const { t } = useTranslation();
  const locationLabel = formatMapLocationLabel(boat.location, boat.country);
  const mapsUrl = mapsSearchUrl(boat.latitude, boat.longitude, locationLabel);

  return (
    <div className="mt-3 flex flex-col gap-2.5">
      <a
        className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-teal hover:text-coral"
        href={mapsUrl}
        rel="noopener noreferrer"
        target="_blank"
        aria-label={t("map.openInMapsAriaLabel", { location: locationLabel })}
      >
        <ExternalLink aria-hidden="true" size={15} strokeWidth={2.25} />
        {t("map.openInMaps")}
      </a>
      {isApproximateMapPin(boat) && (
        <p className="flex items-start gap-2 text-xs leading-relaxed text-slate">
          <MapPin aria-hidden="true" className="mt-0.5 shrink-0" size={14} strokeWidth={2.25} />
          <span>{t("map.approximateLocationNote")}</span>
        </p>
      )}
    </div>
  );
}

export function BoatMap({
  boats,
  compact = false,
  fitKey = "default",
}: {
  boats: Boat[];
  compact?: boolean;
  /** Changes when the search filters change so progressive loads do not keep re-zooming. */
  fitKey?: string;
}) {
  const { t } = useTranslation();
  const center = useMemo<[number, number]>(
    () => (boats[0] ? [boats[0].latitude, boats[0].longitude] : [0, 0]),
    [boats],
  );

  return (
    <div>
      <section
        aria-label={compact ? t("map.sitLocation") : t("map.searchResults")}
        className={`relative isolate z-0 overflow-hidden rounded-3xl border border-line bg-seafoam shadow-card ${
          compact ? "h-96" : "h-[min(68vh,44rem)] min-h-112"
        }`}
      >
        <MapContainer
          center={center}
          className="h-full w-full"
          scrollWheelZoom
          zoom={boats.length === 1 ? 12 : 3}
          zoomControl={false}
        >
          <ZoomControl zoomInTitle={t("map.zoomIn")} zoomOutTitle={t("map.zoomOut")} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapViewport boats={boats} fitKey={fitKey} />
          {boats.map((boat) => (
            <Marker
              eventHandlers={{
                popupopen: (event) => {
                  const close = event.popup
                    .getElement()
                    ?.querySelector<HTMLAnchorElement>(".leaflet-popup-close-button");
                  close?.setAttribute("aria-label", t("common.close"));
                  close?.setAttribute("title", t("common.close"));
                },
              }}
              icon={markerIcon}
              key={boat.id}
              position={[boat.latitude, boat.longitude]}
            >
              <Popup>
                <div className="w-52">
                  <img alt="" className="h-24 w-full rounded-lg object-cover" src={boat.image} />
                  <p className="mt-2 font-display text-base font-bold text-navy">{boat.name}</p>
                  <p className="mt-1 text-xs text-slate">
                    {boat.location}
                    {boat.country && !boat.location.includes(boat.country)
                      ? `, ${boat.country}`
                      : ""}
                  </p>
                  <Link
                    className="boatstead-map-popup-link mt-3 block rounded-lg bg-coral px-3 py-2 text-center text-xs font-bold text-white no-underline hover:bg-coral-dark hover:text-white"
                    to={`/boats/${boat.id}`}
                  >
                    {t("map.viewSit")}
                  </Link>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </section>
      {compact && boats.length === 1 ? <SitMapFooter boat={boats[0]} /> : null}
    </div>
  );
}
