/**
 * Regenerates scripts/seed.sql from src/worker/db/seed-data.ts so the CLI seed
 * and the dev-console reset endpoint can never drift apart.
 *
 * Run:  npm run db:seed:generate
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { seedBoats } from "../src/worker/db/seed-data.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const COLUMNS = [
  ["id", "id"],
  ["name", "name"],
  ["type", "type"],
  ["length", "length"],
  ["location", "location"],
  ["country", "country"],
  ["region", "region"],
  ["dates", "dates"],
  ["dateStart", "date_start"],
  ["dateEnd", "date_end"],
  ["duration", "duration"],
  ["nights", "nights"],
  ["image", "image"],
  ["gallery", "gallery"],
  ["owner", "owner"],
  ["ownerImage", "owner_image"],
  ["rating", "rating"],
  ["reviews", "reviews"],
  ["applicants", "applicants"],
  ["description", "description"],
  ["home", "home"],
  ["responsibilities", "responsibilities"],
  ["systems", "systems"],
  ["requirements", "requirements"],
  ["amenities", "amenities"],
  ["pet", "pet"],
  ["featured", "featured"],
  ["published", "published"],
] as const;

/** SQL literal. Single quotes are escaped by doubling, per SQLite. */
function literal(value: unknown): string {
  if (value === undefined || value === null) return "NULL";
  if (typeof value === "boolean") return value ? "1" : "0";
  if (typeof value === "number") return String(value);
  if (Array.isArray(value)) return `'${JSON.stringify(value).replaceAll("'", "''")}'`;
  return `'${String(value).replaceAll("'", "''")}'`;
}

const rows = seedBoats.map(
  (boat) =>
    "  (" +
    COLUMNS.map(([key]) => literal((boat as Record<string, unknown>)[key])).join(", ") +
    ")",
);

const sql = `-- GENERATED FILE — do not edit by hand.
-- Source: src/worker/db/seed-data.ts
-- Regenerate: npm run db:seed:generate

DELETE FROM boats;

INSERT INTO boats (
${COLUMNS.map(([, col]) => `  ${col}`).join(",\n")}
) VALUES
${rows.join(",\n")};
`;

const out = join(ROOT, "scripts", "seed.sql");
writeFileSync(out, sql, "utf8");
console.log(`Wrote ${seedBoats.length} boats to scripts/seed.sql`);
