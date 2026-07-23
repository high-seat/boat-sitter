CREATE TABLE `user_deleted_conversations` (
	`user_id` text NOT NULL,
	`application_id` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX `user_deleted_conversations_user_idx` ON `user_deleted_conversations` (`user_id`);
