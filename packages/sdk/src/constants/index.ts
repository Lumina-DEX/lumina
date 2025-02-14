export type NetworkLayer = "mina" | "zeko"

export type ChainNetwork = "mainnet" | "devnet" | "testnet"

export type NetworkUri = Exclude<
	`${NetworkLayer}:${ChainNetwork}`,
	"zeko:devnet" | "mina:testnet"
>

export const networks = [
	"mina:mainnet",
	"mina:devnet",
	"zeko:testnet",
	"zeko:mainnet"
] as const

export const urls = {
	"mina:mainnet": "https://api.minascan.io/node/mainnet/v1/graphql",
	"mina:devnet": "https://api.minascan.io/node/devnet/v1/graphql",
	"zeko:testnet": "https://devnet.zeko.io/graphql",
	"zeko:mainnet": "NOT_IMPLEMENTED"
} as const

export const archiveUrls = {
	"mina:mainnet": "https://api.minascan.io/archive/mainnet/v1/graphql",
	"mina:devnet": "https://api.minascan.io/archive/devnet/v1/graphql",
	"zeko:testnet": "https://devnet.zeko.io/graphql",
	"zeko:mainnet": "NOT_IMPLEMENTED"
} as const

// TODO: Add missing factories
export const luminadexFactories = {
	"mina:devnet": "B62qo8GFnNj3JeYq6iUUXeHq5bqJqPQmT5C2cTU7YoVc4mgiC8XEjHd",
	"mina:mainnet": "NOT_IMPLEMENTED",
	"zeko:testnet": "NOT_IMPLEMENTED",
	"zeko:mainnet": "NOT_IMPLEMENTED"
} as const

// TODO: Add missing faucets
export const chainFaucets = {
	"mina:devnet": {
		address: "B62qkUoCRMDTndXpGan1g7iVPAGnXASVT3fqV8QnGqJ5KNiRhnS8nyq",
		tokenAddress: "B62qn71xMXqLmAT83rXW3t7jmnEvezaCYbcnb9NWYz85GTs41VYGDha",
		tokenId: "wZmPhCrDVraeYcB3By5USJCJ9KCMLYYp497Zuby2b8Rq3wTcbn"
	},
	"mina:mainnet": {
		address: "NOT_IMPLEMENTED",
		tokenAddress: "NOT_IMPLEMENTED",
		tokenId: "NOT_IMPLEMENTED"
	},
	"zeko:testnet": {
		address: "NOT_IMPLEMENTED",
		tokenAddress: "NOT_IMPLEMENTED",
		tokenId: "NOT_IMPLEMENTED"
	},
	"zeko:mainnet": {
		address: "NOT_IMPLEMENTED",
		tokenAddress: "NOT_IMPLEMENTED",
		tokenId: "NOT_IMPLEMENTED"
	}
} as const

export const MINA_ADDRESS = "MINA"

export const luminaCdnOrigin = "https://luminadex-contracts-cdn.hebilicious.workers.dev"

export const poolInstance = {
	"mina:devnet": {
		signer: "EKE9dyeMmvz6deCC2jD9rBk7d8bG6ZDqVno8wRe8tAbQDussfBYi",
		user0: "B62qrUAGW6S4pSBcZko2LdbUAhtLd15zVs9KtQedScBvwuZVbcnej35"
	},
	"mina:mainnet": { signer: "NOT_IMPLEMENTED", user0: "NOT_IMPLEMENTED" },
	"zeko:mainnet": { signer: "NOT_IMPLEMENTED", user0: "NOT_IMPLEMENTED" },
	"zeko:testnet": { signer: "NOT_IMPLEMENTED", user0: "NOT_IMPLEMENTED" }
} as const
