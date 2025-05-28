ALTER TABLE `files` DROP FOREIGN KEY `files_user_id_product_id_fk`;
--> statement-breakpoint
ALTER TABLE `files` ADD `product_id` text;--> statement-breakpoint
ALTER TABLE `files` ADD CONSTRAINT `files_product_id_product_id_fk` FOREIGN KEY (`product_id`) REFERENCES `product`(`id`) ON DELETE no action ON UPDATE no action;