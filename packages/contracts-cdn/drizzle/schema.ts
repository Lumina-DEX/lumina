import { sql } from "drizzle-orm"
import { index, integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core"

const tokenTable = (name: string) =>
	sqliteTable(
		name,
		{
			address: text().notNull(),
			poolAddress: text().notNull(),
			tokenId: text().notNull(),
			symbol: text().notNull(),
			decimals: integer().notNull(),
			timestamp: text().default(sql`(CURRENT_TIMESTAMP)`)
		},
		(table) => ({
			pk: primaryKey({ columns: [table.address, table.poolAddress] }),
			symbolChainIdIndex: index(`${name}.symbol_idx`).on(table.symbol),
			poolAddressChainIdIndex: index(`${name}.poolAddress`).on(table.poolAddress)
		})
	)

//Mina Tables
export const minaTestnet = tokenTable("TokenList_mina_testnet")
export const minaBerkeley = tokenTable("TokenList_mina_berkeley")
export const minaMainnet = tokenTable("TokenList_mina_mainnet")

//Zeko Tables
export const zekoTestnet = tokenTable("TokenList_zeko_testnet")
export const zekoMainnet = tokenTable("TokenList_zeko_mainnet")
