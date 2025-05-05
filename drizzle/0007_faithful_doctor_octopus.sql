ALTER TABLE `users` MODIFY COLUMN `id` text NOT NULL DEFAULT ('U6Gsc5soZaAg8sOyGyIna');--> statement-breakpoint
ALTER TABLE `users` ADD `auth_providers` enum('google','default') DEFAULT 'default';--> statement-breakpoint
ALTER TABLE `users` ADD `profile_photo_id` text;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_profile_photo_id_files_id_fk` FOREIGN KEY (`profile_photo_id`) REFERENCES `files`(`id`) ON DELETE set null ON UPDATE no action;