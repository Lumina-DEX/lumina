CREATE TABLE `Multisig` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` integer DEFAULT (current_timestamp) NOT NULL,
	`signer` integer NOT NULL,
	`signature` text NOT NULL,
	`data` text NOT NULL,
	`deadline` integer NOT NULL,
	FOREIGN KEY (`signer`) REFERENCES `SignerMerkle`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `Pool` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` integer DEFAULT (current_timestamp) NOT NULL,
	`token_a` text NOT NULL,
	`token_b` text NOT NULL,
	`public_key` text NOT NULL,
	`user` text NOT NULL,
	`deployed` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `Pool_public_key_unique` ON `Pool` (`public_key`);--> statement-breakpoint
CREATE TABLE `PoolKey` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` integer DEFAULT (current_timestamp) NOT NULL,
	`public_key` integer NOT NULL,
	`signer_1` integer NOT NULL,
	`signer_2` integer NOT NULL,
	`encrypted_key` text NOT NULL,
	`generated_public_1` text NOT NULL,
	`generated_public_2` text NOT NULL,
	FOREIGN KEY (`public_key`) REFERENCES `Pool`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`signer_1`) REFERENCES `SignerMerkle`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`signer_2`) REFERENCES `SignerMerkle`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `SignerMerkle` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` integer DEFAULT (current_timestamp) NOT NULL,
	`public_key` text NOT NULL,
	`permission` text NOT NULL,
	`active` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `SignerMerkle_public_key_unique` ON `SignerMerkle` (`public_key`);