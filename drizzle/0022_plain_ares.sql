CREATE TABLE `property_amenity` (
	`property_id` text NOT NULL,
	`amenity_id` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `property_amenity` ADD CONSTRAINT `property_amenity_property_id_property_id_fk` FOREIGN KEY (`property_id`) REFERENCES `property`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `property_amenity` ADD CONSTRAINT `property_amenity_amenity_id_amentity_id_fk` FOREIGN KEY (`amenity_id`) REFERENCES `amentity`(`id`) ON DELETE no action ON UPDATE no action;