import { useEffect, useMemo } from "react";
import { divIcon, latLngBounds } from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap, ZoomControl } from "react-leaflet";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "leaflet/dist/leaflet.css";
import type { Boat } from "@/mockApi";

const markerIcon = divIcon({
  className: "boatstead-map-marker",
  html: '<span style="display:grid;width:38px;height:38px;place-items:center;border:3px solid white;border-radius:999px;background:#ef7057;color:white;font-size:18px;box-shadow:0 5px 18px rgba(7,48,66,.28)">⚓</span>',
  iconAnchor: [19, 19],
  iconSize: [38, 38],
  popupAnchor: [0, -20],
});

function MapViewport({ boats }: { boats: Boat[] }) {
  const map = useMap();

  useEffect(() => {
    if (!boats.length) return;
    if (boats.length === 1) {
      map.setView([boats[0].latitude, boats[0].longitude], 12);
      return;
    }
    map.fitBounds(
      latLngBounds(boats.map((boat) => [boat.latitude, boat.longitude] as [number, number])),
      { maxZoom: 10, padding: [45, 45] },
    );
  }, [boats, map]);

  return null;
}

export function BoatMap({ boats, compact = false }: { boats: Boat[]; compact?: boolean }) {
  const { t } = useTranslation();
  const center = useMemo<[number, number]>(
    () => (boats[0] ? [boats[0].latitude, boats[0].longitude] : [20, 0]),
    [boats],
  );

  return (
    <section
      aria-label={compact ? t("map.sitLocation") : t("map.searchResults")}
      className={`overflow-hidden rounded-3xl border border-line bg-seafoam shadow-card ${
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
        <MapViewport boats={boats} />
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
                  {boat.country && !boat.location.includes(boat.country) ? `, ${boat.country}` : ""}
                </p>
                <Link
                  className="mt-3 block rounded-lg bg-coral px-3 py-2 text-center text-xs font-bold text-white"
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
  );
}
