ALTER TABLE `users` DROP FOREIGN KEY `users_profile_photo_id_files_id_fk`;
--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `profile_photo_id`;