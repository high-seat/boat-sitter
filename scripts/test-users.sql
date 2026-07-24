-- GENERATED FILE — do not edit by hand.
-- Source: scripts/generate-test-users-sql.ts
-- Regenerate: pnpm db:seed:test:generate
--
-- Login-capable TEST users (email+password, email_verified). Apply only where
-- you want them; run db:unseed:test:* to hide/remove them. Scoped qatest-%.

DELETE FROM account WHERE user_id LIKE 'qatest-%';
DELETE FROM profiles WHERE user_id LIKE 'qatest-%';
DELETE FROM `user` WHERE id LIKE 'qatest-%';

INSERT INTO `user` (id, name, email, email_verified, image, created_at, updated_at) VALUES
  ('qatest-sitter', 'QA Sitter', 'qa@boatstead.test', 1, '', 1735689600, 1735689600);

INSERT INTO account (id, account_id, provider_id, user_id, password, created_at, updated_at) VALUES
  ('qatest-account-sitter', 'qatest-sitter', 'credential', 'qatest-sitter', 'ca9e17697196524fd36cce1c1cac8e0d:7180dcd5f21dd8da78ece4dd51799fb9e7f4126df1b36376049e9739aeb78529bb2307fadb10b91ebc901df4f899c14d0bd7b2652693bb99422b82e9bae27b7b', 1735689600, 1735689600);

INSERT INTO profiles (user_id, name, email, image, location, bio, languages, preferred_countries, skills, years_experience, certifications, member_since) VALUES
  ('qatest-sitter', 'QA Sitter', 'qa@boatstead.test', '', 'Test Harbour, United Kingdom', 'Automated QA test account.', '["English"]', '[]', '[]', 0, '[]', 2025);
