-- World gazetteer for city/country autocomplete.
-- Idempotent: local DBs may already have this table from a prior 0009_world_places apply.
CREATE TABLE IF NOT EXISTS `world_places` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`name_lower` text NOT NULL,
	`country_name` text DEFAULT '' NOT NULL,
	`country_code` text DEFAULT '' NOT NULL,
	`kind` text NOT NULL,
	`latitude` real,
	`longitude` real,
	`population` integer DEFAULT 0 NOT NULL,
	`popular` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `world_places_name_lower_idx` ON `world_places` (`name_lower`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `world_places_kind_name_idx` ON `world_places` (`kind`,`name_lower`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `world_places_popular_idx` ON `world_places` (`popular`);
