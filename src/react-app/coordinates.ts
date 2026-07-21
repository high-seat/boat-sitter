/**
 * Offline coordinate lookup for the destinations in destinations.ts.
 *
 * Replaces the old 10-city table whose fallback dumped every unknown place at
 * [20, 0] (the Atlantic off West Africa). Resolution order:
 *   1. exact city match  → precise city coordinates
 *   2. country match     → country centroid (approximate, but on the right landmass)
 *   3. neither           → null (caller decides what to do)
 *
 * Keyed lowercase; the curly-apostrophe city ("St. George's") is normalised so
 * both apostrophe forms resolve.
 */

export type LatLng = { latitude: number; longitude: number };

const CITY_COORDINATES: Record<string, [number, number]> = {
  amsterdam: [52.3676, 4.9041],
  annapolis: [38.9784, -76.4922],
  antibes: [43.5808, 7.1251],
  athens: [37.9838, 23.7275],
  auckland: [-36.8485, 174.7633],
  barcelona: [41.3874, 2.1686],
  bath: [51.3811, -2.359],
  bergen: [60.3913, 5.3221],
  brighton: [50.8225, -0.1372],
  brisbane: [-27.4698, 153.0251],
  cagliari: [39.2238, 9.1217],
  "cape town": [-33.9249, 18.4241],
  cartagena: [10.391, -75.4794],
  charleston: [32.7765, -79.9311],
  chichester: [50.8365, -0.7792],
  copenhagen: [55.6761, 12.5683],
  corfu: [39.6243, 19.9217],
  cowes: [50.7626, -1.298],
  dubrovnik: [42.6507, 18.0944],
  falmouth: [50.1533, -5.0656],
  "fort lauderdale": [26.1224, -80.1373],
  funchal: [32.6669, -16.9241],
  genoa: [44.4056, 8.9463],
  gibraltar: [36.1408, -5.3536],
  göteborg: [57.7089, 11.9746],
  gothenburg: [57.7089, 11.9746],
  hamilton: [32.2949, -64.7814],
  helsinki: [60.1699, 24.9384],
  honolulu: [21.3069, -157.8583],
  ibiza: [38.9067, 1.4206],
  istanbul: [41.0082, 28.9784],
  "key west": [24.5551, -81.78],
  "la rochelle": [46.1603, -1.1511],
  "las palmas": [28.1235, -15.4363],
  lefkada: [38.7066, 20.7019],
  lisbon: [38.7223, -9.1393],
  liverpool: [53.4084, -2.9916],
  "los angeles": [34.0522, -118.2437],
  marseille: [43.2965, 5.3698],
  melbourne: [-37.8136, 144.9631],
  miami: [25.7617, -80.1918],
  monaco: [43.7384, 7.4246],
  naples: [40.8518, 14.2681],
  nassau: [25.0443, -77.3504],
  newport: [41.4901, -71.3128],
  nice: [43.7102, 7.262],
  oslo: [59.9139, 10.7522],
  palma: [39.5696, 2.6502],
  "panama city": [8.9824, -79.5199],
  plymouth: [50.3755, -4.1427],
  porto: [41.1579, -8.6291],
  portsmouth: [50.8198, -1.088],
  reykjavík: [64.1466, -21.9426],
  reykjavik: [64.1466, -21.9426],
  sausalito: [37.8591, -122.4853],
  seattle: [47.6062, -122.3321],
  singapore: [1.3521, 103.8198],
  split: [43.5081, 16.4402],
  "st. george's": [12.0561, -61.7488],
  stockholm: [59.3293, 18.0686],
  sydney: [-33.8688, 151.2093],
  tallinn: [59.437, 24.7536],
  tampa: [27.9506, -82.4572],
  trogir: [43.515, 16.2517],
  valencia: [39.4699, -0.3763],
  valletta: [35.8989, 14.5146],
  vancouver: [49.2827, -123.1207],
  venice: [45.4408, 12.3155],
  victoria: [48.4284, -123.3656],
  wellington: [-41.2865, 174.7762],
};

const COUNTRY_COORDINATES: Record<string, [number, number]> = {
  australia: [-25.2744, 133.7751],
  bahamas: [25.0343, -77.3963],
  bermuda: [32.3078, -64.7505],
  canada: [56.1304, -106.3468],
  colombia: [4.5709, -74.2973],
  croatia: [45.1, 15.2],
  denmark: [56.2639, 9.5018],
  estonia: [58.5953, 25.0136],
  finland: [61.9241, 25.7482],
  france: [46.6034, 2.2137],
  gibraltar: [36.1408, -5.3536],
  greece: [39.0742, 21.8243],
  grenada: [12.1165, -61.679],
  iceland: [64.9631, -19.0208],
  italy: [41.8719, 12.5674],
  malta: [35.9375, 14.3754],
  monaco: [43.7503, 7.4128],
  netherlands: [52.1326, 5.2913],
  "new zealand": [-40.9006, 174.886],
  norway: [60.472, 8.4689],
  panama: [8.538, -80.7821],
  portugal: [39.3999, -8.2245],
  singapore: [1.3521, 103.8198],
  "south africa": [-30.5595, 22.9375],
  spain: [40.4637, -3.7492],
  sweden: [60.1282, 18.6435],
  türkiye: [38.9637, 35.2433],
  turkey: [38.9637, 35.2433],
  "united kingdom": [54.0, -2.0],
  "united states": [39.8283, -98.5795],
};

const normalize = (value: string) =>
  value.trim().toLowerCase().replace(/’/g, "'").replace(/\s+/g, " ");

/**
 * Resolve coordinates for a location, preferring a city hit, then the country
 * centroid. Returns null if neither is known.
 */
export function lookupCoordinates(location: string, country: string): LatLng | null {
  const city = CITY_COORDINATES[normalize(location)];
  if (city) return { latitude: city[0], longitude: city[1] };

  // Location may itself be a country, or the country field may carry it.
  const byCountry =
    COUNTRY_COORDINATES[normalize(country)] ?? COUNTRY_COORDINATES[normalize(location)];
  if (byCountry) return { latitude: byCountry[0], longitude: byCountry[1] };

  return null;
}
