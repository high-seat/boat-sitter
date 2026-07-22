ALTER TABLE `applications` ADD `party_size` integer DEFAULT 1 NOT NULL;
ALTER TABLE `applications` ADD `owner_phone` text;
ALTER TABLE `application_messages` ADD `kind` text DEFAULT 'user' NOT NULL;
ALTER TABLE `application_messages` ADD `system_kind` text;
ALTER TABLE `application_messages` ADD `payload` text;

CREATE TABLE `profiles` (
	`user_id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`legal_name` text DEFAULT '' NOT NULL,
	`image` text DEFAULT '' NOT NULL,
	`cover_image` text,
	`bio` text DEFAULT '' NOT NULL,
	`location` text DEFAULT '' NOT NULL,
	`languages` text DEFAULT '[]' NOT NULL,
	`preferred_countries` text DEFAULT '[]' NOT NULL,
	`skills` text DEFAULT '[]' NOT NULL,
	`preferred_language` text DEFAULT 'en-US' NOT NULL,
	`measurement_system` text DEFAULT 'metric' NOT NULL,
	`email_notifications` text DEFAULT '{}' NOT NULL,
	`sit_defaults` text DEFAULT '{}' NOT NULL,
	`phone_country_code` text DEFAULT '+44' NOT NULL,
	`phone_number` text DEFAULT '' NOT NULL,
	`member_since` integer DEFAULT 2024 NOT NULL,
	`years_experience` integer DEFAULT 0 NOT NULL,
	`certifications` text DEFAULT '[]' NOT NULL,
	`completed_sits` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX `profiles_name_idx` ON `profiles` (`name`);

CREATE TABLE `reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`sit_id` text NOT NULL,
	`boat_name` text NOT NULL,
	`application_id` text NOT NULL,
	`sitter_name` text NOT NULL,
	`sitter_user_id` text,
	`owner_name` text NOT NULL,
	`owner_user_id` text,
	`owner_image` text DEFAULT '' NOT NULL,
	`rating` integer NOT NULL,
	`text` text NOT NULL,
	`location` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`response_text` text,
	`response_created_at` text
);
CREATE UNIQUE INDEX `reviews_application_id_unique` ON `reviews` (`application_id`);
CREATE INDEX `reviews_sitter_idx` ON `reviews` (`sitter_name`);
CREATE INDEX `reviews_application_idx` ON `reviews` (`application_id`);

CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`user_name` text NOT NULL,
	`type` text NOT NULL,
	`actor` text,
	`boat_name` text,
	`href` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX `notifications_user_id_idx` ON `notifications` (`user_id`);
CREATE INDEX `notifications_user_name_idx` ON `notifications` (`user_name`);
