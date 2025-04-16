import type { ChainNetwork, NetworkUri, urls } from "../../constants"

export type Networks = keyof typeof urls
export type Urls = (typeof urls)[Networks]

export type Balance = {
	[n in NetworkUri]: Record<TokenId, TokenInfo>
}

type TokenId = string

interface TokenInfo {
	symbol: string
	balance: number
}

type TokenBalance = {
	[cn in ChainNetwork]: Record<TokenId, TokenInfo>
}

export interface TokenBalances {
	mina: Omit<TokenBalance, "testnet">
	zeko: Omit<TokenBalance, "devnet">
}

export interface AllTokenBalances {
	mina: TokenBalance
	zeko: TokenBalance
}

export type CustomToken = SimpleToken | LuminaLPToken

export interface SimpleToken {
	address: string
	symbol: string
	decimal: number
	tokenId: string
}

export interface LuminaLPToken {
	poolAddress: string
	decimal: number
	symbol: string
}

export interface FetchBalanceInput {
	address: string
	tokens: CustomToken[]
	network: Networks
}

export type WalletEvent =
	| { type: "RequestNetworkChange"; network: Networks }
	| { type: "WalletExtensionChangedNetwork"; network: Networks }
	| { type: "Connect" }
	| { type: "Disconnect" }
	| { type: "SetAccount"; account: string }
	| {
		type: "FetchBalance"
		network: Networks
		tokens: CustomToken[]
	}

export type WalletEmit =
	| { type: "NetworkChanged"; network: Networks }
	| { type: "AccountChanged"; account: string }
