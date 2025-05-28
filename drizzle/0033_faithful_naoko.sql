CREATE TABLE `subscription` (
	`id` varchar(100) NOT NULL,
	`user_id` text,
	`transaction_id` text,
	`plan_code` text NOT NULL,
	`code` text,
	`active` boolean,
	`expired` boolean,
	`next_payment_at` datetime,
	`transaction_status` enum('pending','failed','success') DEFAULT 'pending',
	`paid_at` datetime,
	`amount` float,
	`reties` int,
	`deleted_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `subscription_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_id_unique` UNIQUE(`id`)
);
--> statement-breakpoint
CREATE TABLE `transaction` (
	`id` varchar(100) NOT NULL,
	`user_id` text,
	`subscription_id` text,
	`plan_code` text NOT NULL,
	`transaction_status` enum('pending','failed','success') DEFAULT 'pending',
	`amount` float,
	`fee` float,
	`paid_at` datetime,
	`deleted_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `transaction_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_id_unique` UNIQUE(`id`)
);
--> statement-breakpoint
ALTER TABLE `subscription` ADD CONSTRAINT `subscription_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subscription` ADD CONSTRAINT `subscription_transaction_id_transaction_id_fk` FOREIGN KEY (`transaction_id`) REFERENCES `transaction`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transaction` ADD CONSTRAINT `transaction_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;