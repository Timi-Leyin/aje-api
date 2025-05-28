CREATE TABLE `gallery` (
	`id` varchar(100) NOT NULL,
	`user_id` text,
	`deleted_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `gallery_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_id_unique` UNIQUE(`id`)
);
--> statement-breakpoint
ALTER TABLE `files` ADD `gallery_id` text;--> statement-breakpoint
ALTER TABLE `gallery` ADD CONSTRAINT `gallery_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `files` ADD CONSTRAINT `files_gallery_id_gallery_id_fk` FOREIGN KEY (`gallery_id`) REFERENCES `gallery`(`id`) ON DELETE no action ON UPDATE no action;