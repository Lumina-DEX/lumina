CREATE TABLE `TokenList_mina_berkeley` (
	`address` text NOT NULL,
	`poolAddress` text NOT NULL,
	`tokenId` text NOT NULL,
	`symbol` text NOT NULL,
	`decimals` integer NOT NULL,
	`timestamp` text DEFAULT (CURRENT_TIMESTAMP),
	PRIMARY KEY(`address`, `poolAddress`)
);
--> statement-breakpoint
CREATE INDEX `TokenList_mina_berkeley.symbol_idx` ON `TokenList_mina_berkeley` (`symbol`);--> statement-breakpoint
CREATE INDEX `TokenList_mina_berkeley.poolAddress` ON `TokenList_mina_berkeley` (`poolAddress`);--> statement-breakpoint
CREATE TABLE `TokenList_mina_mainnet` (
	`address` text NOT NULL,
	`poolAddress` text NOT NULL,
	`tokenId` text NOT NULL,
	`symbol` text NOT NULL,
	`decimals` integer NOT NULL,
	`timestamp` text DEFAULT (CURRENT_TIMESTAMP),
	PRIMARY KEY(`address`, `poolAddress`)
);
--> statement-breakpoint
CREATE INDEX `TokenList_mina_mainnet.symbol_idx` ON `TokenList_mina_mainnet` (`symbol`);--> statement-breakpoint
CREATE INDEX `TokenList_mina_mainnet.poolAddress` ON `TokenList_mina_mainnet` (`poolAddress`);--> statement-breakpoint
CREATE TABLE `TokenList_mina_testnet` (
	`address` text NOT NULL,
	`poolAddress` text NOT NULL,
	`tokenId` text NOT NULL,
	`symbol` text NOT NULL,
	`decimals` integer NOT NULL,
	`timestamp` text DEFAULT (CURRENT_TIMESTAMP),
	PRIMARY KEY(`address`, `poolAddress`)
);
--> statement-breakpoint
CREATE INDEX `TokenList_mina_testnet.symbol_idx` ON `TokenList_mina_testnet` (`symbol`);--> statement-breakpoint
CREATE INDEX `TokenList_mina_testnet.poolAddress` ON `TokenList_mina_testnet` (`poolAddress`);--> statement-breakpoint
CREATE TABLE `TokenList_zeko_mainnet` (
	`address` text NOT NULL,
	`poolAddress` text NOT NULL,
	`tokenId` text NOT NULL,
	`symbol` text NOT NULL,
	`decimals` integer NOT NULL,
	`timestamp` text DEFAULT (CURRENT_TIMESTAMP),
	PRIMARY KEY(`address`, `poolAddress`)
);
--> statement-breakpoint
CREATE INDEX `TokenList_zeko_mainnet.symbol_idx` ON `TokenList_zeko_mainnet` (`symbol`);--> statement-breakpoint
CREATE INDEX `TokenList_zeko_mainnet.poolAddress` ON `TokenList_zeko_mainnet` (`poolAddress`);--> statement-breakpoint
CREATE TABLE `TokenList_zeko_testnet` (
	`address` text NOT NULL,
	`poolAddress` text NOT NULL,
	`tokenId` text NOT NULL,
	`symbol` text NOT NULL,
	`decimals` integer NOT NULL,
	`timestamp` text DEFAULT (CURRENT_TIMESTAMP),
	PRIMARY KEY(`address`, `poolAddress`)
);
--> statement-breakpoint
CREATE INDEX `TokenList_zeko_testnet.symbol_idx` ON `TokenList_zeko_testnet` (`symbol`);--> statement-breakpoint
CREATE INDEX `TokenList_zeko_testnet.poolAddress` ON `TokenList_zeko_testnet` (`poolAddress`);