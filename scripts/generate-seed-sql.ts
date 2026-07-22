/**
 * Regenerates scripts/seed.sql from src/worker/db/seed-data.ts so the CLI seed
 * and the dev-console reset endpoint can never drift apart.
 *
 * Run:  npm run db:seed:generate
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { seedApplications, seedSits, seedVessels } from "../src/worker/db/seed-data.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

function literal(value: unknown): string {
  if (value === undefined || value === null) return "NULL";
  if (typeof value === "boolean") return value ? "1" : "0";
  if (typeof value === "number") return String(value);
  if (typeof value === "object") return `'${JSON.stringify(value).replaceAll("'", "''")}'`;
  return `'${String(value).replaceAll("'", "''")}'`;
}

function insert(table: string, columns: string[], rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const values = rows
    .map((row) => "  (" + columns.map((col) => literal(row[col])).join(", ") + ")")
    .join(",\n");
  return `INSERT INTO ${table} (\n${columns.map((c) => `  ${c}`).join(",\n")}\n) VALUES\n${values};\n`;
}

const vesselCols = [
  ["id", "id"],
  ["name", "name"],
  ["type", "type"],
  ["length", "length"],
  ["homePort", "home_port"],
  ["image", "image"],
  ["gallery", "gallery"],
  ["owner", "owner"],
  ["ownerImage", "owner_image"],
  ["rating", "rating"],
  ["reviews", "reviews"],
  ["description", "description"],
  ["home", "home"],
  ["systems", "systems"],
  ["engineType", "engine_type"],
  ["voltageType", "voltage_type"],
  ["stoveFuelType", "stove_fuel_type"],
  ["amenities", "amenities"],
  ["privateAccess", "private_access"],
] as const;

const sitCols = [
  ["id", "id"],
  ["vesselId", "vessel_id"],
  ["dates", "dates"],
  ["dateStart", "date_start"],
  ["duration", "duration"],
  ["location", "location"],
  ["country", "country"],
  ["fullAddress", "full_address"],
  ["latitude", "latitude"],
  ["longitude", "longitude"],
  ["responsibilities", "responsibilities"],
  ["requirements", "requirements"],
  ["minYearsExperience", "min_years_experience"],
  ["requiredExperience", "required_experience"],
  ["requiredCertifications", "required_certifications"],
  ["requiredSkills", "required_skills"],
  ["applicants", "applicants"],
  ["pet", "pet"],
  ["featured", "featured"],
  ["published", "published"],
  ["sitType", "sit_type"],
] as const;

const mapRow = (cols: readonly (readonly [string, string])[], obj: Record<string, unknown>) =>
  Object.fromEntries(cols.map(([key, col]) => [col, obj[key]]));

const appRows = seedApplications.map((a) => ({
  id: a.id,
  sit_id: a.sitId,
  boat_name: a.boatName,
  owner_name: a.ownerName,
  applicant: a.applicant,
  applicant_name: a.applicant.name,
  initial_message: a.initialMessage,
  status: a.status,
  created_at: a.createdAt,
}));

const messageRows = seedApplications.flatMap((a) =>
  a.messages.map((m) => ({
    id: m.id,
    application_id: a.id,
    sender_name: m.senderName,
    text: m.text,
    created_at: m.createdAt,
  })),
);

const sql = `-- GENERATED FILE — do not edit by hand.
-- Source: src/worker/db/seed-data.ts
-- Regenerate: npm run db:seed:generate

DELETE FROM application_messages;
DELETE FROM applications;
DELETE FROM sits;
DELETE FROM vessels;
DELETE FROM support_requests;

${insert(
  "vessels",
  vesselCols.map(([, c]) => c),
  seedVessels.map((v) => mapRow(vesselCols, v as Record<string, unknown>)),
)}
${insert(
  "sits",
  sitCols.map(([, c]) => c),
  seedSits.map((s) => mapRow(sitCols, s as Record<string, unknown>)),
)}
${insert("applications", ["id", "sit_id", "boat_name", "owner_name", "applicant", "applicant_name", "initial_message", "status", "created_at"], appRows)}
${insert("application_messages", ["id", "application_id", "sender_name", "text", "created_at"], messageRows)}`;

writeFileSync(join(ROOT, "scripts", "seed.sql"), sql, "utf8");
console.log(
  `Wrote ${seedVessels.length} vessels, ${seedSits.length} sits, ${seedApplications.length} applications`,
);
