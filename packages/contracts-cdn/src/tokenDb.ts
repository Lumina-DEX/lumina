import type { Networks, TokenDbList } from "@lumina-dex/sdk"
import type { Token } from "./helper"

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
