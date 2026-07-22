/**
 * Asserts every destination in destinations.ts resolves to real coordinates
 * (not the old [20,0] / [0,0] fallback), so no listing plots in the ocean.
 *
 * Run: node --experimental-strip-types scripts/verify_coordinates.ts
 */
import { lookupCoordinates } from "../src/react-app/coordinates.ts";
import { destinations } from "../src/react-app/destinations.ts";

let failures = 0;

function check(label: string, ok: boolean, detail = "") {
  if (!ok) {
    failures++;
    console.log(`FAIL  ${label} ${detail}`);
  }
}

// Only cities become a listing's location (the sit location autocomplete is
// cityOnly, and home ports are cities). Countries in the destinations list are
// search filters and never need coordinates — so we only require cities, plus
// each city's own country, to resolve.
const cities = destinations.filter((d) => d.kind === "City" && d.name);
for (const d of cities) {
  const hit = lookupCoordinates(d.name, d.detail);
  check(`resolve "${d.name}, ${d.detail}"`, hit !== null);
  if (hit) {
    check(
      `"${d.name}" not at null-island`,
      !(hit.latitude === 0 && hit.longitude === 0) && !(hit.latitude === 20 && hit.longitude === 0),
      JSON.stringify(hit),
    );
  }
  // The city's country should also resolve, so a same-country free-type still lands right.
  check(`country "${d.detail}" resolves`, lookupCoordinates(d.detail, d.detail) !== null);
}

// Spot-check the row we just fixed.
const la = lookupCoordinates("Los Angeles", "United States");
check(
  "Los Angeles latitude ~34",
  Math.abs((la?.latitude ?? 0) - 34.0522) < 0.01,
  JSON.stringify(la),
);
check("Los Angeles longitude ~-118", Math.abs((la?.longitude ?? 0) + 118.2437) < 0.01);

// Curly-apostrophe city resolves.
const grenada = lookupCoordinates("St. George’s", "Grenada");
check("St. George's resolves via curly apostrophe", grenada !== null, JSON.stringify(grenada));

// Unknown place falls back to country, not null-island.
const unknownCity = lookupCoordinates("Nowheresville", "France");
check(
  "unknown city falls back to country centroid",
  unknownCity !== null,
  JSON.stringify(unknownCity),
);

if (failures === 0) {
  console.log(`All coordinate checks passed (${cities.length} cities).`);
} else {
  console.log(`\n${failures} FAILED`);
  process.exit(1);
}
