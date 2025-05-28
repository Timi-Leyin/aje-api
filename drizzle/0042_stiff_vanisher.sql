CREATE TABLE `docs_verification` (
	`id` varchar(100) NOT NULL,
	`user_id` text,
	`deleted_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `docs_verification_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_id_unique` UNIQUE(`id`)
);
--> statement-breakpoint
ALTER TABLE `files` ADD `nin_doc_id` text;--> statement-breakpoint
ALTER TABLE `files` ADD `cac_doc_id` text;--> statement-breakpoint
ALTER TABLE `users` ADD `verification_status` enum('pending','verified','rejected');--> statement-breakpoint
ALTER TABLE `docs_verification` ADD CONSTRAINT `docs_verification_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `files` ADD CONSTRAINT `files_nin_doc_id_docs_verification_id_fk` FOREIGN KEY (`nin_doc_id`) REFERENCES `docs_verification`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `files` ADD CONSTRAINT `files_cac_doc_id_docs_verification_id_fk` FOREIGN KEY (`cac_doc_id`) REFERENCES `docs_verification`(`id`) ON DELETE no action ON UPDATE no action;