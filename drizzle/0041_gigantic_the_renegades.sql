CREATE TABLE `report` (
	`id` varchar(100) NOT NULL,
	`category` text NOT NULL,
	`details` text,
	`property_id` text,
	`product_id` text,
	`artisan_id` text,
	CONSTRAINT `report_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_id_unique` UNIQUE(`id`)
);
--> statement-breakpoint
ALTER TABLE `report` ADD CONSTRAINT `report_property_id_property_id_fk` FOREIGN KEY (`property_id`) REFERENCES `property`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `report` ADD CONSTRAINT `report_product_id_product_id_fk` FOREIGN KEY (`product_id`) REFERENCES `product`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `report` ADD CONSTRAINT `report_artisan_id_users_id_fk` FOREIGN KEY (`artisan_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;