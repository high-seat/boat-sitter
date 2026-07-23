/**
 * Build scripts/world-places.sql from:
 *  - country-list (every country)
 *  - GeoNames cities15000 (cities with population ≥ 15k + seats of government)
 *  - curated marina/coastal towns used by Boatstead seed listings
 *
 * Run: pnpm db:seed:places:generate
 * Then: pnpm db:seed:places:local
 */
import { createWriteStream, createReadStream } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import { createInterface } from "node:readline";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { getData, getName } from "country-list";
import { lookupCoordinates } from "../src/react-app/coordinates.ts";

const execFileAsync = promisify(execFile);
const OUT = new URL("./world-places.sql", import.meta.url);
const GEONAMES_URL = "https://download.geonames.org/export/dump/cities15000.zip";

/** Display names that match Boatstead / flag helpers. */
const COUNTRY_NAME_BY_ISO: Record<string, string> = {
  BO: "Bolivia",
  BN: "Brunei",
  CI: "Ivory Coast",
  CZ: "Czechia",
  GB: "United Kingdom",
  IR: "Iran",
  KP: "North Korea",
  KR: "South Korea",
  LA: "Laos",
  MD: "Moldova",
  MK: "North Macedonia",
  RU: "Russia",
  SY: "Syria",
  TR: "Türkiye",
  TW: "Taiwan",
  TZ: "Tanzania",
  US: "United States",
  VA: "Vatican City",
  VE: "Venezuela",
  VN: "Vietnam",
};

const POPULAR_COUNTRIES = new Set([
  "Greece",
  "Spain",
  "United Kingdom",
  "Croatia",
  "Italy",
  "France",
  "Sweden",
  "Norway",
  "Grenada",
  "Canada",
  "United States",
]);

/** Curated marina towns (may be below GeoNames 15k threshold). */
const CURATED_CITIES: Array<{ name: string; country: string }> = [
  { name: "Auckland", country: "New Zealand" },
  { name: "Amsterdam", country: "Netherlands" },
  { name: "Annapolis", country: "United States" },
  { name: "Antibes", country: "France" },
  { name: "Athens", country: "Greece" },
  { name: "Barcelona", country: "Spain" },
  { name: "Bath", country: "United Kingdom" },
  { name: "Bergen", country: "Norway" },
  { name: "Brighton", country: "United Kingdom" },
  { name: "Brisbane", country: "Australia" },
  { name: "Cagliari", country: "Italy" },
  { name: "Cape Town", country: "South Africa" },
  { name: "Cartagena", country: "Colombia" },
  { name: "Charleston", country: "United States" },
  { name: "Chichester", country: "United Kingdom" },
  { name: "Copenhagen", country: "Denmark" },
  { name: "Corfu", country: "Greece" },
  { name: "Cowes", country: "United Kingdom" },
  { name: "Dubrovnik", country: "Croatia" },
  { name: "Falmouth", country: "United Kingdom" },
  { name: "Fort Lauderdale", country: "United States" },
  { name: "Funchal", country: "Portugal" },
  { name: "Genoa", country: "Italy" },
  { name: "Gibraltar", country: "Gibraltar" },
  { name: "Göteborg", country: "Sweden" },
  { name: "Hamilton", country: "Bermuda" },
  { name: "Helsinki", country: "Finland" },
  { name: "Honolulu", country: "United States" },
  { name: "Ibiza", country: "Spain" },
  { name: "Istanbul", country: "Türkiye" },
  { name: "Key West", country: "United States" },
  { name: "La Rochelle", country: "France" },
  { name: "Las Palmas", country: "Spain" },
  { name: "Lefkada", country: "Greece" },
  { name: "Lisbon", country: "Portugal" },
  { name: "Liverpool", country: "United Kingdom" },
  { name: "Los Angeles", country: "United States" },
  { name: "Marseille", country: "France" },
  { name: "Melbourne", country: "Australia" },
  { name: "Miami", country: "United States" },
  { name: "Monaco", country: "Monaco" },
  { name: "Naples", country: "Italy" },
  { name: "Nassau", country: "Bahamas" },
  { name: "Newport", country: "United States" },
  { name: "Nice", country: "France" },
  { name: "Oslo", country: "Norway" },
  { name: "Palma", country: "Spain" },
  { name: "Panama City", country: "Panama" },
  { name: "Plymouth", country: "United Kingdom" },
  { name: "Porto", country: "Portugal" },
  { name: "Portsmouth", country: "United Kingdom" },
  { name: "Reykjavík", country: "Iceland" },
  { name: "Sausalito", country: "United States" },
  { name: "Seattle", country: "United States" },
  { name: "Singapore", country: "Singapore" },
  { name: "Split", country: "Croatia" },
  { name: "St. George’s", country: "Grenada" },
  { name: "Stockholm", country: "Sweden" },
  { name: "Sydney", country: "Australia" },
  { name: "Tallinn", country: "Estonia" },
  { name: "Tampa", country: "United States" },
  { name: "Tokyo", country: "Japan" },
  { name: "Trogir", country: "Croatia" },
  { name: "Valencia", country: "Spain" },
  { name: "Valletta", country: "Malta" },
  { name: "Vancouver", country: "Canada" },
  { name: "Venice", country: "Italy" },
  { name: "Victoria", country: "Canada" },
  { name: "Wellington", country: "New Zealand" },
];

type PlaceRow = {
  id: string;
  name: string;
  nameLower: string;
  countryName: string;
  countryCode: string;
  kind: "city" | "country";
  latitude: number | null;
  longitude: number | null;
  population: number;
  popular: boolean;
};

function sqlString(value: string) {
  return `'${value.replaceAll("'", "''")}'`;
}

function sqlNum(value: number | null) {
  return value === null || Number.isNaN(value) ? "NULL" : String(value);
}

function countryNameForIso(code: string) {
  const upper = code.toUpperCase();
  return COUNTRY_NAME_BY_ISO[upper] ?? getName(upper) ?? upper;
}

function isoForCountryName(name: string) {
  const override = Object.entries(COUNTRY_NAME_BY_ISO).find(([, n]) => n === name);
  if (override) return override[0];
  const hit = getData().find((row) => row.name === name);
  return hit?.code ?? "";
}

async function downloadCities15000(): Promise<string> {
  const dir = await mkdir(join(tmpdir(), "boatstead-geonames"), { recursive: true }).then(() =>
    join(tmpdir(), "boatstead-geonames"),
  );
  const zipPath = join(dir, "cities15000.zip");
  const txtPath = join(dir, "cities15000.txt");

  console.log("Downloading GeoNames cities15000…");
  const res = await fetch(GEONAMES_URL);
  if (!res.ok || !res.body) {
    throw new Error(`GeoNames download failed (${res.status})`);
  }
  await pipeline(
    Readable.fromWeb(res.body as import("node:stream/web").ReadableStream),
    createWriteStream(zipPath),
  );

  // Unzip via system unzip, or Python's zipfile as a fallback.
  try {
    await execFileAsync("unzip", ["-o", zipPath, "-d", dir]);
  } catch {
    await execFileAsync("python3", [
      "-c",
      `import zipfile; zipfile.ZipFile(${JSON.stringify(zipPath)}).extractall(${JSON.stringify(dir)})`,
    ]);
  }
  return txtPath;
}

async function loadGeoNamesCities(txtPath: string): Promise<PlaceRow[]> {
  const rows: PlaceRow[] = [];
  const seen = new Set<string>();
  const rl = createInterface({ input: createReadStream(txtPath, { encoding: "utf8" }) });

  for await (const line of rl) {
    if (!line || line.startsWith("#")) continue;
    const cols = line.split("\t");
    // geonameid, name, asciiname, alternatenames, lat, lng, feature class, feature code,
    // country code, cc2, admin1, admin2, admin3, admin4, population, elevation, dem, timezone, mod
    const id = cols[0];
    const name = cols[1];
    const lat = Number(cols[4]);
    const lng = Number(cols[5]);
    const featureClass = cols[6];
    const countryCode = (cols[8] || "").toUpperCase();
    const population = Number(cols[14] || 0);
    if (featureClass !== "P" || !name || !countryCode) continue;

    const countryName = countryNameForIso(countryCode);
    const key = `${name.toLowerCase()}|${countryCode}`;
    if (seen.has(key)) continue;
    seen.add(key);

    rows.push({
      id: `geoname-${id}`,
      name,
      nameLower: name.toLowerCase(),
      countryName,
      countryCode,
      kind: "city",
      latitude: Number.isFinite(lat) ? lat : null,
      longitude: Number.isFinite(lng) ? lng : null,
      population: Number.isFinite(population) ? population : 0,
      popular: false,
    });
  }
  return rows;
}

function curatedCityRows(): PlaceRow[] {
  return CURATED_CITIES.map((city) => {
    const coords = lookupCoordinates(city.name, city.country);
    const code = isoForCountryName(city.country);
    return {
      id: `curated-${city.name.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-")}-${code || "xx"}`,
      name: city.name,
      nameLower: city.name.toLowerCase(),
      countryName: city.country,
      countryCode: code,
      kind: "city" as const,
      latitude: coords?.latitude ?? null,
      longitude: coords?.longitude ?? null,
      population: 1,
      popular: true,
    };
  });
}

function countryRows(): PlaceRow[] {
  return getData().map((row) => {
    const name = COUNTRY_NAME_BY_ISO[row.code] ?? row.name;
    const coords = lookupCoordinates(name, name);
    return {
      id: `country-${row.code.toLowerCase()}`,
      name,
      nameLower: name.toLowerCase(),
      countryName: name,
      countryCode: row.code,
      kind: "country" as const,
      latitude: coords?.latitude ?? null,
      longitude: coords?.longitude ?? null,
      population: 0,
      popular: POPULAR_COUNTRIES.has(name),
    };
  });
}

function mergeCities(geonames: PlaceRow[], curated: PlaceRow[]) {
  const byKey = new Map<string, PlaceRow>();
  for (const row of geonames) {
    byKey.set(`${row.nameLower}|${row.countryCode}`, row);
  }
  for (const row of curated) {
    const key = `${row.nameLower}|${row.countryCode}`;
    const existing = byKey.get(key);
    if (existing) {
      byKey.set(key, {
        ...existing,
        popular: existing.popular || row.popular,
        latitude: existing.latitude ?? row.latitude,
        longitude: existing.longitude ?? row.longitude,
        // Prefer curated display spelling when GeoNames differs (e.g. Göteborg).
        name: row.name,
        nameLower: row.nameLower,
        countryName: row.countryName || existing.countryName,
      });
    } else {
      byKey.set(key, row);
    }
  }
  return [...byKey.values()];
}

function insertStatements(rows: PlaceRow[], batchSize = 200) {
  const lines: string[] = [
    "-- Generated by scripts/generate-world-places-sql.ts. Do not edit by hand.",
    "DELETE FROM world_places;",
  ];
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const values = batch
      .map(
        (row) =>
          `(${sqlString(row.id)}, ${sqlString(row.name)}, ${sqlString(row.nameLower)}, ${sqlString(row.countryName)}, ${sqlString(row.countryCode)}, ${sqlString(row.kind)}, ${sqlNum(row.latitude)}, ${sqlNum(row.longitude)}, ${row.population}, ${row.popular ? 1 : 0})`,
      )
      .join(",\n  ");
    lines.push(
      `INSERT INTO world_places (id, name, name_lower, country_name, country_code, kind, latitude, longitude, population, popular) VALUES\n  ${values};`,
    );
  }
  return `${lines.join("\n")}\n`;
}

async function main() {
  const txtPath = await downloadCities15000();
  const geonames = await loadGeoNamesCities(txtPath);
  const cities = mergeCities(geonames, curatedCityRows());
  const countries = countryRows();
  // Deduplicate country display names (overrides can collide with getData names).
  const uniqueCountries = [...new Map(countries.map((row) => [row.countryCode, row])).values()];
  const all = [...uniqueCountries, ...cities].sort(
    (a, b) => a.kind.localeCompare(b.kind) || a.name.localeCompare(b.name),
  );

  const sql = insertStatements(all);
  await writeFile(OUT, sql, "utf8");
  console.log(
    `Wrote ${all.length} places (${uniqueCountries.length} countries, ${cities.length} cities) → ${OUT.pathname}`,
  );
}

await main();
