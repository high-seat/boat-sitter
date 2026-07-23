CREATE TABLE `sitter_availability` (
	`id` text PRIMARY KEY NOT NULL,
	`sitter_user_id` text NOT NULL,
	`sitter_name` text DEFAULT '' NOT NULL,
	`date_start` text NOT NULL,
	`date_end` text NOT NULL,
	`regions` text DEFAULT '[]' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`booked_application_id` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX `sitter_availability_sitter_idx` ON `sitter_availability` (`sitter_user_id`);
CREATE INDEX `sitter_availability_status_idx` ON `sitter_availability` (`status`);
CREATE INDEX `sitter_availability_date_start_idx` ON `sitter_availability` (`date_start`);
CREATE INDEX `sitter_availability_date_end_idx` ON `sitter_availability` (`date_end`);
