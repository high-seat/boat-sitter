ALTER TABLE `reviews` ADD `author_role` text DEFAULT 'owner' NOT NULL;
ALTER TABLE `reviews` ADD `author_image` text DEFAULT '' NOT NULL;
UPDATE `reviews` SET `author_image` = `owner_image` WHERE `author_image` = '' OR `author_image` IS NULL;
DROP INDEX IF EXISTS `reviews_application_id_unique`;
CREATE UNIQUE INDEX `reviews_application_author_unique` ON `reviews` (`application_id`, `author_role`);
CREATE INDEX `reviews_owner_idx` ON `reviews` (`owner_name`);
CREATE INDEX `reviews_application_author_idx` ON `reviews` (`application_id`, `author_role`);
