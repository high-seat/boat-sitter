/**
 * Generates the TEST-USER seed — login-capable accounts (email + password
 * credential, email-verified) used by the automated core test.
 *
 * Kept SEPARATE from the demo seed (scripts/seed.sql) so it acts like a flag you
 * apply per environment:
 *   - apply it (db:seed:test:*) where you want a login-capable test account
 *     (local + staging, and prod if you want the prod core test to run)
 *   - remove it (db:unseed:test:*) to hide it from an environment
 *
 * Every id is `qatest-` prefixed with scoped deletes, so it never touches real
 * users AND is not caught by the demo seed's `seed-%` teardown (so it survives
 * demo re-seeds). It's fully reversible. The test user is a SITTER with no boat,
 * so it never appears in the public boats listing regardless.
 *
 * Credentials come from TEST_USER_EMAIL / TEST_USER_PASSWORD (with defaults), so
 * the seeded account matches the CI secrets the core test signs in with. Because
 * the password hash embeds a random salt, re-generating changes the file — that
 * is expected.
 *
 * Run:  pnpm db:seed:test:generate
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { hashPassword } from "better-auth/crypto";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const TS = 1_735_689_600; // 2025-01-01, integer seconds (Better Auth timestamps)

const email = process.env.TEST_USER_EMAIL ?? "qa@boatstead.test";
const password = process.env.TEST_USER_PASSWORD ?? "OsDKMComlipzcpWRuECKA+K1";

const esc = (s: string) => s.replaceAll("'", "''");

const USER_ID = "qatest-sitter";
const NAME = "QA Sitter";

// Scoped teardown — reused by both the seed and the "remove" (hide) file.
// `qatest-` (not `seed-`) so the demo seed's seed-% teardown never removes it.
const removeSql = `DELETE FROM account WHERE user_id LIKE 'qatest-%';
DELETE FROM profiles WHERE user_id LIKE 'qatest-%';
DELETE FROM \`user\` WHERE id LIKE 'qatest-%';
`;

const header = `-- GENERATED FILE — do not edit by hand.
-- Source: scripts/generate-test-users-sql.ts
-- Regenerate: pnpm db:seed:test:generate
`;

async function main() {
  const hash = await hashPassword(password);

  const seedSql = `${header}--
-- Login-capable TEST users (email+password, email_verified). Apply only where
-- you want them; run db:unseed:test:* to hide/remove them. Scoped qatest-%.

${removeSql}
INSERT INTO \`user\` (id, name, email, email_verified, image, created_at, updated_at) VALUES
  ('${USER_ID}', '${esc(NAME)}', '${esc(email)}', 1, '', ${TS}, ${TS});

INSERT INTO account (id, account_id, provider_id, user_id, password, created_at, updated_at) VALUES
  ('qatest-account-sitter', '${USER_ID}', 'credential', '${USER_ID}', '${hash}', ${TS}, ${TS});

INSERT INTO profiles (user_id, name, email, image, location, bio, languages, preferred_countries, skills, years_experience, certifications, member_since) VALUES
  ('${USER_ID}', '${esc(NAME)}', '${esc(email)}', '', 'Test Harbour, United Kingdom', 'Automated QA test account.', '["English"]', '[]', '[]', 0, '[]', 2025);
`;

  writeFileSync(join(ROOT, "scripts", "test-users.sql"), seedSql, "utf8");
  writeFileSync(
    join(ROOT, "scripts", "test-users-remove.sql"),
    `${header}-- Removes (hides) the test users. Scoped qatest-%.\n\n${removeSql}`,
    "utf8",
  );
  console.log(`Wrote test-users.sql + test-users-remove.sql for ${email} (${USER_ID}).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
