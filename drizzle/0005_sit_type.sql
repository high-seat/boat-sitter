ALTER TABLE `sits` ADD `sit_type` text DEFAULT 'liveaboard' NOT NULL;
CREATE INDEX `sits_sit_type_idx` ON `sits` (`sit_type`);
