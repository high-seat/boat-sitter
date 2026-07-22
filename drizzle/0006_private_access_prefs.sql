ALTER TABLE `vessels` ADD `private_access` text;

CREATE TABLE `user_saved` (
	`user_id` text NOT NULL,
	`sit_id` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX `user_saved_user_idx` ON `user_saved` (`user_id`);

CREATE TABLE `user_archived_conversations` (
	`user_id` text NOT NULL,
	`application_id` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX `user_archived_conversations_user_idx` ON `user_archived_conversations` (`user_id`);

CREATE TABLE `user_archived_sits` (
	`user_id` text NOT NULL,
	`sit_id` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX `user_archived_sits_user_idx` ON `user_archived_sits` (`user_id`);

CREATE TABLE `user_blocks` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`blocked_name` text NOT NULL,
	`blocked_image` text DEFAULT '' NOT NULL,
	`blocked_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX `user_blocks_user_idx` ON `user_blocks` (`user_id`);

CREATE TABLE `user_reports` (
	`id` text PRIMARY KEY NOT NULL,
	`reporter_user_id` text NOT NULL,
	`target_name` text NOT NULL,
	`reason` text NOT NULL,
	`details` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`escalated` integer DEFAULT 0 NOT NULL,
	`application_id` text,
	`boat_name` text,
	`message_id` text,
	`message_text` text,
	`message_created_at` text
);
CREATE INDEX `user_reports_reporter_idx` ON `user_reports` (`reporter_user_id`);
