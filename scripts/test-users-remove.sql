-- GENERATED FILE — do not edit by hand.
-- Source: scripts/generate-test-users-sql.ts
-- Regenerate: pnpm db:seed:test:generate
-- Removes (hides) the test users. Scoped qatest-%.

DELETE FROM account WHERE user_id LIKE 'qatest-%';
DELETE FROM profiles WHERE user_id LIKE 'qatest-%';
DELETE FROM `user` WHERE id LIKE 'qatest-%';
