import { defineRelations, sql } from "drizzle-orm"
import { index, integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core"

const chainIds = ["mina:devnet", "mina:mainnet", "zeko:testnet", "zeko:mainnet"] as const

export const tokens = sqliteTable(
	"Token",
	{
		address: text().notNull(),
		tokenId: text().notNull(),
		symbol: text().notNull(),
		chainId: text({ enum: chainIds }).notNull(),
		decimals: integer().notNull(),
		timestamp: text().default(sql`(CURRENT_TIMESTAMP)`)
	},
	(table) => [primaryKey({ columns: [table.address, table.chainId] }), index("Token_chainId_idx").on(table.chainId)]
)
export const pools = sqliteTable(
	"Pool",
	{
		address: text().notNull(),
		token0Address: text().notNull(),
		token1Address: text().notNull(),
		chainId: text({ enum: chainIds }).notNull(),
		tokenId: text().notNull(),
		name: text().notNull(),
		timestamp: text().default(sql`(CURRENT_TIMESTAMP)`)
	},
	(table) => [
		primaryKey({ columns: [table.address, table.chainId] }),
		index("Pool_chainId_idx").on(table.chainId),
		index("Pool.token0_idx").on(table.token0Address),
		index("Pool.token1_idx").on(table.token1Address)
	]
)

export const relations = defineRelations({ tokens, pools }, (r) => ({
	pools: {
		token0: r.one.tokens({
			from: [r.pools.token0Address, r.pools.chainId],
			to: [r.tokens.address, r.tokens.chainId]
		}),
		token1: r.one.tokens({
			from: [r.pools.token1Address, r.pools.chainId],
			to: [r.tokens.address, r.tokens.chainId]
		})
	},
	tokens: {
		poolsAsToken0: r.many.pools({
			from: [r.tokens.address, r.tokens.chainId],
			to: [r.pools.token0Address, r.pools.chainId]
		}),
		poolsAsToken1: r.many.pools({
			from: [r.tokens.address, r.tokens.chainId],
			to: [r.pools.token1Address, r.pools.chainId]
		})
	}
}))
