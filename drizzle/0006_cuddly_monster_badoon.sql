CREATE TABLE `files` (
	`id` text NOT NULL,
	`src` text NOT NULL,
	`file_providers` enum('cloudinary'),
	`deleted_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `files_id` PRIMARY KEY(`id`),
	CONSTRAINT `files_id_unique` UNIQUE(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `id` text NOT NULL DEFAULT ('K-QcoMaQku8mkb7d765yS');