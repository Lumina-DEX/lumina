type NetworkLayer = "mina" | "zeko"

export type ChainNetwork = "mainnet" | "berkeley" | "testnet"

export type NetworkUri = Exclude<`${NetworkLayer}:${ChainNetwork}`, "zeko:berkeley">

export const networks = [
	"mina:mainnet",
	"mina:berkeley",
	"mina:testnet",
	"zeko:testnet",
	"zeko:mainnet"
] as const

export const urls = {
	"mina:mainnet": "https://api.minascan.io/node/mainnet/v1/graphql",
	"mina:berkeley": "https://api.minascan.io/node/berkeley/v1/graphql",
	"mina:testnet": "https://api.minascan.io/node/devnet/v1/graphql",
	"zeko:testnet": "https://devnet.zeko.io/graphql",
	"zeko:mainnet": "https://devnet.zeko.io/graphql"
} as const

export const archiveUrls = {
	"mina:mainnet": "https://api.minascan.io/archive/mainnet/v1/graphql",
	"mina:berkeley": "https://api.minascan.io/archive/devnet/v1/graphql",
	"mina:testnet": "https://api.minascan.io/archive/devnet/v1/graphql",
	"zeko:testnet": "https://devnet.zeko.io/graphql",
	"zeko:mainnet": "https://devnet.zeko.io/graphql"
} as const

// TODO: Add missing factories
export const luminadexFactories = {
	"mina:testnet": "B62qo8GFnNj3JeYq6iUUXeHq5bqJqPQmT5C2cTU7YoVc4mgiC8XEjHd"
} as const

// TODO: Add missing faucets
export const chainFaucets = {
	"mina:testnet": {
		address: "B62qkUoCRMDTndXpGan1g7iVPAGnXASVT3fqV8QnGqJ5KNiRhnS8nyq",
		tokenAddress: "B62qn71xMXqLmAT83rXW3t7jmnEvezaCYbcnb9NWYz85GTs41VYGDha",
		tokenId: "wZmPhCrDVraeYcB3By5USJCJ9KCMLYYp497Zuby2b8Rq3wTcbn"
	},
	"mina:mainnet": { address: "NOT Implemented", tokenAddress: "", tokenId: "" },
	"mina:berkeley": { address: "testnet-address-2", tokenAddress: "", tokenId: "" },
	"zeko:testnet": { address: "zeko-test", tokenAddress: "", tokenId: "" },
	"zeko:mainnet": { address: "zeko-test", tokenAddress: "", tokenId: "" }
} as const

export const MINA_ADDRESS = "MINA"

export const luminaCdnOrigin = "https://luminadex-contracts-cdn.hebilicious.workers.dev"
