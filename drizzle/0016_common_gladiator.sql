CREATE TABLE `amentity` (
	`id` varchar(100) NOT NULL,
	`property_id` text,
	`name` varchar(255),
	`deleted_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `amentity_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_id_unique` UNIQUE(`id`)
);
--> statement-breakpoint
CREATE TABLE `property` (
	`id` varchar(100) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`price` float NOT NULL,
	`currency` enum('USD','NGN'),
	`lat` float,
	`lon` float,
	`city` varchar(100),
	`address` varchar(255),
	`listingType` varchar(25) NOT NULL,
	`type` varchar(50) NOT NULL,
	`bathrooms` int DEFAULT 0,
	`beds` int DEFAULT 0,
	`bedrooms` int DEFAULT 0,
	`deleted_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `property_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_id_unique` UNIQUE(`id`)
);
--> statement-breakpoint
CREATE TABLE `schedule` (
	`id` varchar(100) NOT NULL,
	`property_id` text,
	`weekday` varchar(25),
	`from` timestamp,
	`to` timestamp,
	`deleted_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `schedule_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_id_unique` UNIQUE(`id`)
);
--> statement-breakpoint
ALTER TABLE `files` MODIFY COLUMN `id` varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `id` varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE `files` ADD `property_id` text;--> statement-breakpoint
ALTER TABLE `amentity` ADD CONSTRAINT `amentity_property_id_property_id_fk` FOREIGN KEY (`property_id`) REFERENCES `property`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `schedule` ADD CONSTRAINT `schedule_property_id_property_id_fk` FOREIGN KEY (`property_id`) REFERENCES `property`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `files` ADD CONSTRAINT `files_property_id_property_id_fk` FOREIGN KEY (`property_id`) REFERENCES `property`(`id`) ON DELETE no action ON UPDATE no action;