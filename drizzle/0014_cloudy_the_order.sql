ALTER TABLE `files` DROP INDEX `files_id_unique`;--> statement-breakpoint
ALTER TABLE `files` MODIFY COLUMN `id` varchar(100) NOT NULL DEFAULT 'zyM0C-o5Kri4LiTp9iuDh';--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `id` varchar(100) NOT NULL DEFAULT 'zyM0C-o5Kri4LiTp9iuDh';--> statement-breakpoint
ALTER TABLE `files` ADD CONSTRAINT `users_id_unique` UNIQUE(`id`);