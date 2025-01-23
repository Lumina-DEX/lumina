import type { ChainNetwork, NetworkUri, urls } from "../../constants"

export type Networks = keyof typeof urls
export type Urls = (typeof urls)[Networks]

export type Balance = {
	[n in NetworkUri]: Record<string, number>
}

type TokenBalance = {
	[cn in ChainNetwork]: Record<string, number>
}
export type TokenBalances = {
	mina: TokenBalance
	zeko: TokenBalance
}

export type CustomToken = { address: string; symbol: string; decimal: number; tokenId: string }

export type FetchBalanceInput = { address: string; token?: CustomToken; networks: Networks[] }

export type WalletEvent =
	| { type: "RequestNetworkChange"; network: Networks }
	| { type: "WalletExtensionChangedNetwork"; network: Networks }
	| { type: "Connect" }
	| { type: "Disconnect" }
	| { type: "SetAccount"; account: string }
	| { type: "FetchBalance"; token?: CustomToken; networks: Networks[] }

export type WalletEmit =
	| { type: "NetworkChanged"; network: Networks }
	| { type: "AccountChanged"; account: string }
