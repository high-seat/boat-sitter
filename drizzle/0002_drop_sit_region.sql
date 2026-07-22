-- Drop sit sailing-area region; location is city + country only.
DROP INDEX IF EXISTS `sits_region_idx`;--> statement-breakpoint
ALTER TABLE `sits` DROP COLUMN `region`;
