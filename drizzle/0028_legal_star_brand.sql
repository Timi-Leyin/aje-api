CREATE TABLE `product` (
	`id` varchar(100) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`price` float NOT NULL,
	`currency` enum('USD','NGN'),
	`lat` float,
	`lon` float,
	`city` varchar(100),
	`address` varchar(255),
	`type` varchar(50) NOT NULL,
	`user_id` text,
	`deleted_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `product_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_id_unique` UNIQUE(`id`)
);
--> statement-breakpoint
ALTER TABLE `product` ADD CONSTRAINT `product_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;