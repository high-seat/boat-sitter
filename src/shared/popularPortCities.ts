/**
 * Ranked marina / port cities for Boatstead empty-state autocomplete.
 * Shown when a destination field is focused before the user types.
 */
export const TOP_BOAT_SITTING_PORT_CITIES = [
  { name: "Lefkada", countryName: "Greece" },
  { name: "Palma", countryName: "Spain" },
  { name: "Split", countryName: "Croatia" },
  { name: "Antibes", countryName: "France" },
  { name: "Fort Lauderdale", countryName: "United States" },
] as const;

export const TOP_BOAT_SITTING_PORT_CITY_LIMIT = TOP_BOAT_SITTING_PORT_CITIES.length;
