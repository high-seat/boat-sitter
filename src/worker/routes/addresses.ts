import { Hono } from "hono";
import { parseAddressSearchParams, type AddressSuggestion } from "../../shared/addressSearch";

/**
 * Global street / marina address autocomplete.
 * Proxies Photon (OpenStreetMap / Komoot) so the browser never talks to the
 * third party directly and we can swap providers later without UI changes.
 */
export const addressesRouter = new Hono<{ Bindings: Env }>();

type PhotonProperties = {
  osm_type?: string;
  osm_id?: number;
  name?: string;
  street?: string;
  housenumber?: string;
  postcode?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  district?: string;
  county?: string;
  state?: string;
  country?: string;
  countrycode?: string;
  type?: string;
};

type PhotonFeature = {
  type: string;
  geometry?: { type: string; coordinates?: [number, number] };
  properties?: PhotonProperties;
};

type PhotonResponse = {
  features?: PhotonFeature[];
};

const PHOTON_LANGS = new Set([
  "default",
  "en",
  "de",
  "fr",
  "it",
  "es",
  "nl",
  "pt",
  "pl",
  "ru",
  "zh",
]);

addressesRouter.get("/", async (c) => {
  const params = parseAddressSearchParams(c.req.query());
  const query = params.q ?? "";
  if (query.length < 3) {
    return c.json({ data: [] as AddressSuggestion[] });
  }

  const lang = PHOTON_LANGS.has(params.lang ?? "") ? (params.lang as string) : "en";
  const url = new URL("https://photon.komoot.io/api/");
  url.searchParams.set("q", query);
  url.searchParams.set("limit", String(params.limit ?? 8));
  url.searchParams.set("lang", lang);

  let payload: PhotonResponse;
  try {
    const upstream = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "User-Agent": "Boatstead/1.0 (address autocomplete; https://boatstead.app)",
      },
    });
    if (!upstream.ok) {
      console.error("Photon address search failed", upstream.status);
      return c.json({ error: "Address search unavailable" }, 502);
    }
    payload = (await upstream.json()) as PhotonResponse;
  } catch (error) {
    console.error("Photon address search error", error);
    return c.json({ error: "Address search unavailable" }, 502);
  }

  const seen = new Set<string>();
  const data: AddressSuggestion[] = [];
  for (const [index, feature] of (payload.features ?? []).entries()) {
    const suggestion = shapeSuggestion(feature, index);
    if (!suggestion) continue;
    if (seen.has(suggestion.label)) continue;
    seen.add(suggestion.label);
    data.push(suggestion);
    if (data.length >= (params.limit ?? 8)) break;
  }

  return c.json({ data });
});

function locality(props: PhotonProperties) {
  return (
    props.city || props.town || props.village || props.municipality || props.district || undefined
  );
}

function cleanPostcode(postcode: string | undefined) {
  if (!postcode) return undefined;
  // Photon sometimes returns multiple codes joined with `;`.
  const first = postcode
    .split(";")
    .map((part) => part.trim())
    .find(Boolean);
  return first || undefined;
}

function shapeSuggestion(feature: PhotonFeature, index: number): AddressSuggestion | null {
  const props = feature.properties;
  if (!props) return null;

  const streetLine = [props.housenumber, props.street].filter(Boolean).join(" ").trim();
  const primary = streetLine || props.name?.trim() || "";
  if (!primary) return null;

  const place = locality(props);
  const secondaryParts = [cleanPostcode(props.postcode), place, props.state, props.country].filter(
    (part, partIndex, all) => Boolean(part) && all.indexOf(part) === partIndex,
  );
  const secondary = secondaryParts.join(", ");
  const label = secondary ? `${primary}, ${secondary}` : primary;

  const osmType = props.osm_type ?? "x";
  const osmId = props.osm_id ?? "unknown";
  const coords = feature.geometry?.coordinates;
  const longitude = coords?.[0];
  const latitude = coords?.[1];
  const coordKey =
    typeof latitude === "number" && typeof longitude === "number"
      ? `${latitude.toFixed(5)},${longitude.toFixed(5)}`
      : String(index);

  return {
    id: `${osmType}-${osmId}-${coordKey}-${index}`,
    label,
    primary,
    secondary,
    latitude: typeof latitude === "number" ? latitude : undefined,
    longitude: typeof longitude === "number" ? longitude : undefined,
    countryCode: props.countrycode?.toUpperCase() || undefined,
  };
}
