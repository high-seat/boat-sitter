export type Destination = {
  name: string;
  detail: string;
  kind: "City" | "Country";
  latitude?: number;
  longitude?: number;
  countryCode?: string;
};

/**
 * Curated marina towns kept for coordinate verification and seed merge.
 * Live autocomplete reads from `/api/destinations` (D1 `world_places`).
 */
export const curatedMarinaCities: Destination[] = [
  "Auckland|New Zealand",
  "Amsterdam|Netherlands",
  "Annapolis|United States",
  "Antibes|France",
  "Athens|Greece",
  "Barcelona|Spain",
  "Bath|United Kingdom",
  "Bergen|Norway",
  "Brighton|United Kingdom",
  "Brisbane|Australia",
  "Cagliari|Italy",
  "Cape Town|South Africa",
  "Cartagena|Colombia",
  "Charleston|United States",
  "Chichester|United Kingdom",
  "Copenhagen|Denmark",
  "Corfu|Greece",
  "Cowes|United Kingdom",
  "Dubrovnik|Croatia",
  "Falmouth|United Kingdom",
  "Fort Lauderdale|United States",
  "Funchal|Portugal",
  "Genoa|Italy",
  "Gibraltar|Gibraltar",
  "Göteborg|Sweden",
  "Hamilton|Bermuda",
  "Helsinki|Finland",
  "Honolulu|United States",
  "Ibiza|Spain",
  "Istanbul|Türkiye",
  "Key West|United States",
  "La Rochelle|France",
  "Las Palmas|Spain",
  "Lefkada|Greece",
  "Lisbon|Portugal",
  "Liverpool|United Kingdom",
  "Los Angeles|United States",
  "Marseille|France",
  "Melbourne|Australia",
  "Miami|United States",
  "Monaco|Monaco",
  "Naples|Italy",
  "Nassau|Bahamas",
  "Newport|United States",
  "Nice|France",
  "Oslo|Norway",
  "Palma|Spain",
  "Panama City|Panama",
  "Plymouth|United Kingdom",
  "Porto|Portugal",
  "Portsmouth|United Kingdom",
  "Reykjavík|Iceland",
  "Sausalito|United States",
  "Seattle|United States",
  "Singapore|Singapore",
  "Split|Croatia",
  "St. George’s|Grenada",
  "Stockholm|Sweden",
  "Sydney|Australia",
  "Tallinn|Estonia",
  "Tampa|United States",
  "Tokyo|Japan",
  "Trogir|Croatia",
  "Valencia|Spain",
  "Valletta|Malta",
  "Vancouver|Canada",
  "Venice|Italy",
  "Victoria|Canada",
  "Wellington|New Zealand",
].map((row) => {
  const [name, detail] = row.split("|");
  return { name, detail, kind: "City" as const };
});
