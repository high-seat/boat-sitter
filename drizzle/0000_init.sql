CREATE TABLE `boats` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`length` text NOT NULL,
	`location` text NOT NULL,
	`country` text NOT NULL,
	`region` text NOT NULL,
	`dates` text NOT NULL,
	`date_start` text NOT NULL,
	`date_end` text,
	`duration` text NOT NULL,
	`nights` integer,
	`image` text NOT NULL,
	`gallery` text DEFAULT '[]' NOT NULL,
	`owner` text NOT NULL,
	`owner_image` text,
	`rating` real DEFAULT 0 NOT NULL,
	`reviews` integer DEFAULT 0 NOT NULL,
	`applicants` integer DEFAULT 0 NOT NULL,
	`description` text NOT NULL,
	`home` text,
	`responsibilities` text DEFAULT '[]' NOT NULL,
	`systems` text DEFAULT '[]' NOT NULL,
	`requirements` text DEFAULT '[]' NOT NULL,
	`amenities` text DEFAULT '[]' NOT NULL,
	`pet` text,
	`featured` integer DEFAULT false NOT NULL,
	`published` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `boats_region_idx` ON `boats` (`region`);--> statement-breakpoint
CREATE INDEX `boats_country_idx` ON `boats` (`country`);--> statement-breakpoint
CREATE INDEX `boats_date_start_idx` ON `boats` (`date_start`);--> statement-breakpoint
CREATE INDEX `boats_featured_idx` ON `boats` (`featured`);--> statement-breakpoint
CREATE INDEX `boats_published_idx` ON `boats` (`published`);
