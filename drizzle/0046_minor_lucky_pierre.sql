CREATE TABLE `user_current_location` (
	`id` varchar(100) NOT NULL,
	`user_id` text,
	`lat` float,
	`lon` float,
	`address` text,
	`manually_added` boolean DEFAULT false,
	`deleted_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_current_location_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_id_unique` UNIQUE(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `auth_provider` enum('google','apple','default') DEFAULT 'default';--> statement-breakpoint
ALTER TABLE `user_current_location` ADD CONSTRAINT `user_current_location_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;