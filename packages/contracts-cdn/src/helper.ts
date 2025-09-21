import type { Networks } from "@lumina-dex/sdk"
import * as v from "valibot"
import { pools, tokens } from "../drizzle/schema"

export { pools, tokens }

export type Token = typeof tokens.$inferInsert
export type Pool = typeof pools.$inferInsert

export type PoolWithTokens = Pool & { tokens: Token[] }

export interface Network {
	network: Networks
}
export interface FindTokenBy extends Network {
	by: "symbol" | "address"
	value: string
}

export interface FindPoolBy extends Network {
	by: "address" | "tokenAddress"
	value: string
}

export interface Exists extends Network {
	address: string
}

export const formatPoolWithTokensResults = (data: { Pool: Pool; Token: Token | null }[]) => {
	const formatted = data.reduce((acc, { Pool, Token }) => {
		const pool = acc.get(Pool?.address)
		if (pool && Token) {
			pool.tokens.push(Token)
			return acc
		}

		acc.set(Pool?.address, {
			...Pool,
			tokens: Token ? [Token] : []
		})
		return acc
	}, new Map<string, PoolWithTokens>())
	return formatted.size > 0 ? Array.from(formatted.values()) : []
}

const chainId = v.union([
	v.literal("mina:devnet"),
	v.literal("mina:mainnet"),
	v.literal("zeko:testnet"),
	v.literal("zeko:mainnet")
])

export const TokenSchema = v.object({
	symbol: v.string(),
	address: v.string(),
	tokenId: v.string(),
	decimals: v.number(),
	chainId: chainId
})

export const PoolSchema = v.object({
	address: v.string(),
	token0Address: v.string(),
	token1Address: v.string(),
	tokenId: v.string(),
	name: v.string(),
	chainId: chainId
})
