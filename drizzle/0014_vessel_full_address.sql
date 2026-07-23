-- Private street/marina address on vessels (public surfaces keep home_port city/country only).
ALTER TABLE `vessels` ADD `full_address` text;
