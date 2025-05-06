CREATE TABLE `Pool` (
	`address` text NOT NULL,
	`token0Address` text NOT NULL,
	`token1Address` text NOT NULL,
	`chainId` text NOT NULL,
	`name` text NOT NULL,
	`timestamp` text DEFAULT (CURRENT_TIMESTAMP),
	PRIMARY KEY(`address`, `chainId`)
);
--> statement-breakpoint
CREATE INDEX `Pool_chainId_idx` ON `Pool` (`chainId`);--> statement-breakpoint
CREATE INDEX `Pool.token0_idx` ON `Pool` (`token0Address`);--> statement-breakpoint
CREATE INDEX `Pool.token1_idx` ON `Pool` (`token1Address`);--> statement-breakpoint
CREATE TABLE `Token` (
	`address` text NOT NULL,
	`tokenId` text NOT NULL,
	`symbol` text NOT NULL,
	`chainId` text NOT NULL,
	`decimals` integer NOT NULL,
	`timestamp` text DEFAULT (CURRENT_TIMESTAMP),
	PRIMARY KEY(`address`, `chainId`)
);
--> statement-breakpoint
CREATE INDEX `Token_chainId_idx` ON `Token` (`chainId`);--> statement-breakpoint
DROP TABLE `TokenList_mina_devnet`;--> statement-breakpoint
DROP TABLE `TokenList_mina_mainnet`;--> statement-breakpoint
DROP TABLE `TokenList_zeko_mainnet`;--> statement-breakpoint
DROP TABLE `TokenList_zeko_testnet`;