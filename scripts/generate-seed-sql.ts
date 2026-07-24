/**
 * Regenerates scripts/seed.sql from src/worker/db/seed-data.ts so the CLI seed
 * and the dev-console reset endpoint can never drift apart.
 *
 * Run:  npm run db:seed:generate
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  SEED_USER_TIMESTAMP,
  seedApplications,
  seedAvailability,
  seedProfiles,
  seedSits,
  seedUsers,
  seedVessels,
} from "../src/worker/db/seed-data.ts";
import {
  extraApplications,
  extraAvailability,
  extraProfiles,
  extraReviews,
  extraSits,
  extraUsers,
  extraVessels,
} from "../src/worker/db/seed-data-extra.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// Base (hand-written) + generated bulk data, merged into one dataset.
const allUsers = [...seedUsers, ...extraUsers];
const allProfiles = [...seedProfiles, ...extraProfiles];
const allVessels = [...seedVessels, ...extraVessels];
const allSits = [...seedSits, ...extraSits];
const allApplications = [...seedApplications, ...extraApplications];
const allAvailability = [...seedAvailability, ...extraAvailability];

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
  ["fullAddress", "full_address"],
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

// Link domain rows to seed users by matching display name — lets us set
// owner_user_id / applicant_user_id without editing the vessel/application data.
const userIdByName = new Map(allUsers.map((u) => [u.name, u.id]));

const vesselRows = allVessels.map((v) => ({
  ...mapRow(vesselCols, v as Record<string, unknown>),
  owner_user_id: userIdByName.get((v as { owner: string }).owner) ?? null,
}));

const userRows = allUsers.map((u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  email_verified: u.emailVerified,
  image: u.image,
  created_at: SEED_USER_TIMESTAMP,
  updated_at: SEED_USER_TIMESTAMP,
}));

const profileRows = allProfiles.map((p) => ({
  user_id: p.userId,
  name: p.name,
  email: p.email,
  image: p.image,
  location: p.location,
  bio: p.bio,
  languages: p.languages,
  preferred_countries: p.preferredCountries,
  skills: p.skills,
  years_experience: p.yearsExperience,
  certifications: p.certifications,
  member_since: p.memberSince,
}));

const availabilityRows = allAvailability.map((a) => ({
  id: a.id,
  sitter_user_id: a.sitterUserId,
  sitter_name: a.sitterName,
  date_start: a.dateStart,
  date_end: a.dateEnd,
  regions: a.regions,
  notes: a.notes,
  status: a.status,
}));

const appRows = allApplications.map((a) => ({
  id: a.id,
  sit_id: a.sitId,
  boat_name: a.boatName,
  owner_name: a.ownerName,
  applicant: a.applicant,
  applicant_name: a.applicant.name,
  applicant_user_id: userIdByName.get(a.applicant.name) ?? null,
  initial_message: a.initialMessage,
  status: a.status,
  created_at: a.createdAt,
}));

const messageRows = allApplications.flatMap((a) =>
  a.messages.map((m) => ({
    id: m.id,
    application_id: a.id,
    sender_name: m.senderName,
    text: m.text,
    created_at: m.createdAt,
  })),
);

const reviewRows = extraReviews.map((r) => ({
  id: r.id,
  sit_id: r.sitId,
  boat_name: r.boatName,
  application_id: r.applicationId,
  sitter_name: r.sitterName,
  sitter_user_id: r.sitterUserId,
  owner_name: r.ownerName,
  owner_user_id: r.ownerUserId,
  owner_image: r.ownerImage,
  rating: r.rating,
  text: r.text,
  location: r.location,
  created_at: r.createdAt,
}));

const sql = `-- GENERATED FILE — do not edit by hand.
-- Source: src/worker/db/seed-data.ts
-- Regenerate: npm run db:seed:generate

-- Scoped resets: only rows this seed owns are cleared, so boats/sits/accounts
-- you create yourself (owner_user_id not 'seed-%') survive a re-seed. Every seed
-- vessel is owned by a seed-user-*, so we key the listing wipe off that. Child →
-- parent order. Safe to run against production.
DELETE FROM application_messages WHERE application_id IN (
  SELECT id FROM applications WHERE sit_id IN (
    SELECT id FROM sits WHERE vessel_id IN (
      SELECT id FROM vessels WHERE owner_user_id LIKE 'seed-%')));
DELETE FROM applications WHERE sit_id IN (
  SELECT id FROM sits WHERE vessel_id IN (
    SELECT id FROM vessels WHERE owner_user_id LIKE 'seed-%'));
DELETE FROM sits WHERE vessel_id IN (
  SELECT id FROM vessels WHERE owner_user_id LIKE 'seed-%');
DELETE FROM vessels WHERE owner_user_id LIKE 'seed-%';
DELETE FROM reviews WHERE id LIKE 'seed-%';
DELETE FROM sitter_availability WHERE id LIKE 'seed-%';
DELETE FROM profiles WHERE user_id LIKE 'seed-%';
DELETE FROM \`user\` WHERE id LIKE 'seed-%';

${insert(
  "`user`",
  ["id", "name", "email", "email_verified", "image", "created_at", "updated_at"],
  userRows,
)}
${insert(
  "profiles",
  [
    "user_id",
    "name",
    "email",
    "image",
    "location",
    "bio",
    "languages",
    "preferred_countries",
    "skills",
    "years_experience",
    "certifications",
    "member_since",
  ],
  profileRows,
)}
${insert("vessels", [...vesselCols.map(([, c]) => c), "owner_user_id"], vesselRows)}
${insert(
  "sits",
  sitCols.map(([, c]) => c),
  allSits.map((s) => mapRow(sitCols, s as Record<string, unknown>)),
)}
${insert("applications", ["id", "sit_id", "boat_name", "owner_name", "applicant", "applicant_name", "applicant_user_id", "initial_message", "status", "created_at"], appRows)}
${insert("application_messages", ["id", "application_id", "sender_name", "text", "created_at"], messageRows)}
${insert(
  "sitter_availability",
  ["id", "sitter_user_id", "sitter_name", "date_start", "date_end", "regions", "notes", "status"],
  availabilityRows,
)}
${insert(
  "reviews",
  [
    "id",
    "sit_id",
    "boat_name",
    "application_id",
    "sitter_name",
    "sitter_user_id",
    "owner_name",
    "owner_user_id",
    "owner_image",
    "rating",
    "text",
    "location",
    "created_at",
  ],
  reviewRows,
)}`;

writeFileSync(join(ROOT, "scripts", "seed.sql"), sql, "utf8");
console.log(
  `Wrote ${allUsers.length} users, ${allProfiles.length} profiles, ${allVessels.length} vessels, ${allSits.length} sits, ${allApplications.length} applications, ${allAvailability.length} availability windows, ${reviewRows.length} reviews`,
);
