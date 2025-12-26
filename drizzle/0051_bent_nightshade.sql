CREATE TABLE `installment_application` (
	`id` varchar(100) NOT NULL,
	`type` varchar(50) NOT NULL,
	`full_name` varchar(255) NOT NULL,
	`phone` varchar(20) NOT NULL,
	`email` varchar(255) NOT NULL,
	`date_of_birth` date,
	`residential_address` text,
	`state` varchar(100),
	`bvn` varchar(20),
	`nin` varchar(20),
	`id_type` varchar(50),
	`employment_verification_required` boolean DEFAULT false,
	`employment_status` varchar(50),
	`employer_name` varchar(255),
	`job_title` varchar(100),
	`monthly_income` varchar(50),
	`employment_length` varchar(50),
	`property_id` text,
	`marketplace_id` text,
	`guarantor_name` varchar(255),
	`guarantor_phone` varchar(20),
	`guarantor_relationship` varchar(50),
	`guarantor_employer` varchar(255),
	`deleted_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `installment_application_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_id_unique` UNIQUE(`id`)
);
--> statement-breakpoint
ALTER TABLE `files` ADD `installment_application_id` text;--> statement-breakpoint
ALTER TABLE `installment_application` ADD CONSTRAINT `installment_application_property_id_property_id_fk` FOREIGN KEY (`property_id`) REFERENCES `property`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `installment_application` ADD CONSTRAINT `installment_application_marketplace_id_product_id_fk` FOREIGN KEY (`marketplace_id`) REFERENCES `product`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `files` ADD CONSTRAINT `files_installment_application_id_installment_application_id_fk` FOREIGN KEY (`installment_application_id`) REFERENCES `installment_application`(`id`) ON DELETE no action ON UPDATE no action;