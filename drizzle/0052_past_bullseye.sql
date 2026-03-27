ALTER TABLE `installment_application` ADD `is_external_property` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `installment_application` ADD `external_property_link` text;--> statement-breakpoint
ALTER TABLE `installment_application` ADD `external_property_location` text;