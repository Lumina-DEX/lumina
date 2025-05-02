import type { Networks, TokenDbList } from "@lumina-dex/sdk"
import { pools, tokens } from "../drizzle/schema"

export { tokens, pools }

export type Token = typeof tokens.$inferInsert
export type Pool = typeof pools.$inferInsert

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

const version = { major: 1, minor: 0, patch: 0 }
const keywords = ["uniswap", "default", "list"]

export const createList =
	(network: Networks) =>
	(data: Token[]): TokenDbList => {
		return {
			name: "Mina alpha",
			timestamp: new Date().toJSON(),
			version,
			keywords,
			tokens: data.map((t) => ({ ...t, chainId: network }))
		}
	}
