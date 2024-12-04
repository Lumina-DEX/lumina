type NetworkLayer = "mina" | "zeko"

export type ChainNetwork = "mainnet" | "berkeley" | "testnet"

export type NetworkUri = `${NetworkLayer}:${ChainNetwork}`

export const urls = {
	"mina:mainnet": "https://api.minascan.io/node/mainnet/v1/graphql",
	"mina:berkeley": "https://api.minascan.io/node/berkeley/v1/graphql",
	"mina:testnet": "https://api.minascan.io/node/devnet/v1/graphql",
	"zeko:testnet": "https://devnet.zeko.io/graphql"
} as const

export const luminadexFactories = {
	"mina:testnet": "B62qnHMCGiqjFzC25yuKBjxC5yXFqfozsfgrjR22Gk2BdjJrmQqNVqi"
} as const

// TODO: Additional token support
export const supportedTokens = {
	mina: "wSHV2S4qX9jFsLjQo8r1BsMLH2ZRKsZx6EJd1sbozGPieEC4Jf"
} as const

export const MINA_ADDRESS = "MINA"

export const luminaCdnOrigin = "https://luminadex-contracts-cdn.hebilicious.workers.dev"
