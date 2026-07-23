-- World gazetteer for city/country autocomplete.
CREATE TABLE `world_places` (
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
CREATE INDEX `world_places_name_lower_idx` ON `world_places` (`name_lower`);
--> statement-breakpoint
CREATE INDEX `world_places_kind_name_idx` ON `world_places` (`kind`,`name_lower`);
--> statement-breakpoint
CREATE INDEX `world_places_popular_idx` ON `world_places` (`popular`);
