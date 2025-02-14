ALTER TABLE `TokenList_mina_testnet` RENAME TO `TokenList_mina_devnet`;--> statement-breakpoint
DROP TABLE `TokenList_mina_berkeley`;--> statement-breakpoint
DROP INDEX IF EXISTS `TokenList_mina_testnet.symbol_idx`;--> statement-breakpoint
DROP INDEX IF EXISTS `TokenList_mina_testnet.poolAddress`;--> statement-breakpoint
CREATE INDEX `TokenList_mina_devnet.symbol_idx` ON `TokenList_mina_devnet` (`symbol`);--> statement-breakpoint
CREATE INDEX `TokenList_mina_devnet.poolAddress` ON `TokenList_mina_devnet` (`poolAddress`);