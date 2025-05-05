ALTER TABLE `users` MODIFY COLUMN `id` text NOT NULL DEFAULT ('J-N6a7sT5E6UIlXaYrg2x');--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `updated_at` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `users` ADD `password` text;--> statement-breakpoint
ALTER TABLE `users` ADD `user_types` enum('buyer','agent','vendor','artisan','admin') DEFAULT 'buyer';--> statement-breakpoint
ALTER TABLE `users` ADD `last_login` timestamp DEFAULT (now());--> statement-breakpoint
ALTER TABLE `users` ADD `deleted_at` timestamp;