CREATE TABLE `advertisement` (
	`id` varchar(100) NOT NULL,
	`title` text,
	`description` text,
	`cta` text,
	`cta_link` text,
	`deleted_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `advertisement_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_id_unique` UNIQUE(`id`)
);
--> statement-breakpoint
ALTER TABLE `files` ADD `advertisement_id` text;--> statement-breakpoint
ALTER TABLE `files` ADD CONSTRAINT `files_advertisement_id_advertisement_id_fk` FOREIGN KEY (`advertisement_id`) REFERENCES `advertisement`(`id`) ON DELETE no action ON UPDATE no action;