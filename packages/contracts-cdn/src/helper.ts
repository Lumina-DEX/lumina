import type { Networks, TokenDbList } from "@lumina-dex/sdk"
import { minaBerkeley, minaMainnet, minaTestnet, zekoMainnet, zekoTestnet } from "../drizzle/schema"

export const getTable = (network: Networks) => {
	const table = {
		"mina:mainnet": minaMainnet,
		"mina:testnet": minaTestnet,
		"mina:berkeley": minaBerkeley,
		"zeko:testnet": zekoTestnet,
		"zeko:mainnet": zekoMainnet
	}[network]
	if (!table) throw new Error(`Table not found for network: ${network}`)
	return table
}

export type Token = typeof minaMainnet.$inferInsert

export interface Network {
	network: Networks
}
export interface FindTokenBy extends Network {
	by: "symbol" | "address" | "poolAddress"
	value: string
}

export interface TokenExists extends Network {
	address: string
	poolAddress: string
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
