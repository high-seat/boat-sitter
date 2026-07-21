-- Replaces the single `boats` table with the normalised vessel/sit model
-- plus applications, messages and support requests.
DROP TABLE IF EXISTS `boats`;
--> statement-breakpoint
CREATE TABLE `vessels` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`length` text NOT NULL,
	`home_port` text NOT NULL,
	`image` text NOT NULL,
	`gallery` text DEFAULT '[]' NOT NULL,
	`owner` text NOT NULL,
	`owner_image` text NOT NULL,
	`rating` real DEFAULT 0 NOT NULL,
	`reviews` integer DEFAULT 0 NOT NULL,
	`description` text NOT NULL,
	`home` text DEFAULT '' NOT NULL,
	`systems` text DEFAULT '[]' NOT NULL,
	`engine_type` text DEFAULT 'Not specified' NOT NULL,
	`voltage_type` text DEFAULT 'Not specified' NOT NULL,
	`stove_fuel_type` text DEFAULT 'Not specified' NOT NULL,
	`amenities` text DEFAULT '[]' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `vessels_owner_idx` ON `vessels` (`owner`);
--> statement-breakpoint
CREATE TABLE `sits` (
	`id` text PRIMARY KEY NOT NULL,
	`vessel_id` text NOT NULL REFERENCES `vessels`(`id`) ON DELETE CASCADE,
	`dates` text NOT NULL,
	`date_start` text NOT NULL,
	`duration` text NOT NULL,
	`location` text NOT NULL,
	`country` text NOT NULL,
	`region` text DEFAULT '' NOT NULL,
	`latitude` real,
	`longitude` real,
	`responsibilities` text DEFAULT '[]' NOT NULL,
	`requirements` text DEFAULT '[]' NOT NULL,
	`min_years_experience` integer,
	`required_experience` text DEFAULT '[]' NOT NULL,
	`required_certifications` text DEFAULT '[]' NOT NULL,
	`required_skills` text DEFAULT '[]' NOT NULL,
	`applicants` integer DEFAULT 0 NOT NULL,
	`pet` text,
	`featured` integer DEFAULT false NOT NULL,
	`published` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `sits_vessel_idx` ON `sits` (`vessel_id`);
--> statement-breakpoint
CREATE INDEX `sits_region_idx` ON `sits` (`region`);
--> statement-breakpoint
CREATE INDEX `sits_country_idx` ON `sits` (`country`);
--> statement-breakpoint
CREATE INDEX `sits_date_start_idx` ON `sits` (`date_start`);
--> statement-breakpoint
CREATE INDEX `sits_published_idx` ON `sits` (`published`);
--> statement-breakpoint
CREATE TABLE `applications` (
	`id` text PRIMARY KEY NOT NULL,
	`sit_id` text NOT NULL,
	`boat_name` text NOT NULL,
	`owner_name` text NOT NULL,
	`applicant` text NOT NULL,
	`applicant_name` text NOT NULL,
	`initial_message` text NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `applications_sit_idx` ON `applications` (`sit_id`);
--> statement-breakpoint
CREATE INDEX `applications_owner_idx` ON `applications` (`owner_name`);
--> statement-breakpoint
CREATE INDEX `applications_applicant_idx` ON `applications` (`applicant_name`);
--> statement-breakpoint
CREATE TABLE `application_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`application_id` text NOT NULL REFERENCES `applications`(`id`) ON DELETE CASCADE,
	`sender_name` text NOT NULL,
	`text` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `application_messages_app_idx` ON `application_messages` (`application_id`);
--> statement-breakpoint
CREATE TABLE `support_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`topic` text NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`message` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
