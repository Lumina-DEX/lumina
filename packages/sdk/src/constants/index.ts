import { version } from "../../../contracts/package.json" with { type: "json" }

export type NetworkLayer = "mina" | "zeko"

export type ChainNetwork = "mainnet" | "devnet" | "testnet"

export type NetworkUri = Exclude<`${NetworkLayer}:${ChainNetwork}`, "zeko:devnet" | "mina:testnet">

export const networks = ["mina:mainnet", "mina:devnet", "zeko:testnet", "zeko:mainnet"] as const

/**
 * Factory start block deployment
 */
export const startBlock: Record<NetworkUri, number> = {
	"mina:mainnet": 0,
	"mina:devnet": 388_667,
	"zeko:mainnet": 0,
	"zeko:testnet": 5_748
} as const

export const urls = {
	"mina:mainnet": "https://api.minascan.io/node/mainnet/v1/graphql",
	"mina:devnet": "https://api.minascan.io/node/devnet/v1/graphql",
	"zeko:testnet": "https://devnet.zeko.io/graphql",
	"zeko:mainnet": "NOT_IMPLEMENTED"
} as const

export type SupportedNetwork = keyof typeof urls

export const archiveUrls = {
	"mina:mainnet": "https://api.minascan.io/archive/mainnet/v1/graphql",
	"mina:devnet": "https://api.minascan.io/archive/devnet/v1/graphql",
	"zeko:testnet": "https://devnet.zeko.io/graphql",
	"zeko:mainnet": "NOT_IMPLEMENTED"
} as const

export const luminadexFactories = {
	"mina:devnet": "B62qmd6mCFwMsVTbithqqSYMLgELaF5kZT714ea5MtR6gquB5stCBbz",
	"mina:mainnet": "B62qmgn7v9BSL49ou2XQpvF5Zw2u23qJJyCKpjT3aTW8jkpqLjSdC4a",
	"zeko:testnet": "B62qmd6mCFwMsVTbithqqSYMLgELaF5kZT714ea5MtR6gquB5stCBbz",
	"zeko:mainnet": "NOT_IMPLEMENTED"
} as const

export const chainFaucets = {
	"mina:devnet": {
		address: "B62qkUoCRMDTndXpGan1g7iVPAGnXASVT3fqV8QnGqJ5KNiRhnS8nyq",
		tokenAddress: "B62qn71xMXqLmAT83rXW3t7jmnEvezaCYbcnb9NWYz85GTs41VYGDha",
		tokenId: "wZmPhCrDVraeYcB3By5USJCJ9KCMLYYp497Zuby2b8Rq3wTcbn"
	},
	// TODO: Add missing faucets
	"mina:mainnet": {
		address: "NOT_IMPLEMENTED",
		tokenAddress: "NOT_IMPLEMENTED",
		tokenId: "NOT_IMPLEMENTED"
	},
	"zeko:testnet": {
		address: "B62qkUoCRMDTndXpGan1g7iVPAGnXASVT3fqV8QnGqJ5KNiRhnS8nyq",
		tokenAddress: "B62qn71xMXqLmAT83rXW3t7jmnEvezaCYbcnb9NWYz85GTs41VYGDha",
		tokenId: "wZmPhCrDVraeYcB3By5USJCJ9KCMLYYp497Zuby2b8Rq3wTcbn"
	},
	// TODO: Add missing faucets
	"zeko:mainnet": {
		address: "NOT_IMPLEMENTED",
		tokenAddress: "NOT_IMPLEMENTED",
		tokenId: "NOT_IMPLEMENTED"
	}
} as const

export const MINA_ADDRESS = "MINA"

/**
 * CDN URL Scheme
 * @example https://cdn.luminadex.com/api/manifest/v1.0.0
 * @example https://cdn.luminadex.com/v1.0.0/cache/file.txt
 * @example https://cdn.luminadex.com/v1.0.0/bundle.zip
 */
export const luminaCdnOrigin = "https://cdn.luminadex.com"

export const contractsVersion = `${version}`

export const defaultFee = {
	"zeko:testnet": undefined,
	"zeko:mainnet": undefined,
	"mina:devnet": undefined,
	"mina:mainnet": undefined
} as const

export const defaultCreationFee = {
	"zeko:testnet": 10 ** 8,
	"zeko:mainnet": undefined,
	"mina:devnet": undefined,
	"mina:mainnet": undefined
} as const

//TODO: Is the signer address always the same ?
export const poolInstance = {
	"mina:devnet": {
		signer: "EKF4sSFc1w5PTFVT8Q4KbbujcM283nyp1dQCht686DeiPtYZswso"
	},
	"mina:mainnet": {
		signer: "EKF4sSFc1w5PTFVT8Q4KbbujcM283nyp1dQCht686DeiPtYZswso"
	},
	"zeko:mainnet": { signer: "NOT_IMPLEMENTED" },
	"zeko:testnet": {
		signer: "EKF4sSFc1w5PTFVT8Q4KbbujcM283nyp1dQCht686DeiPtYZswso"
	}
} as const

export const poolCreationUrl = "https://pool-signer.luminadex.com/graphql"
