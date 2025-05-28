ALTER TABLE `files` MODIFY COLUMN `file_provider` enum('cloudinary','self_hosted');--> statement-breakpoint
ALTER TABLE `files` ADD `name` varchar(100);