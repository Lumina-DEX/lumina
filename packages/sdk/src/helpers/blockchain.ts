import { fetchAccount, fetchEvents, Field, PublicKey } from "o1js"
import { luminaCdnOrigin, luminadexFactories, urls } from "../constants"
import type { Networks } from "../machines/wallet"

export interface TokenDbToken {
	address: string
	poolAddress: string
	chainId: string
	tokenId: string
	name: string
	symbol: string
	decimals: number
}

export interface TokenDbList {
	name: string
	timestamp: string
	version: {
		major: number
		minor: number
		patch: number
	}
	keywords: string[]
	tokens: TokenDbToken[]
}

/**
 * Internal function to fetch all pool events.
 */
export const internal_fetchAllPoolEvents = async (network: Networks) => {
	const url = urls[network]
	const factoryAddress = luminadexFactories[network as "mina:testnet"] // TODO: Support all factories
	if (!factoryAddress) throw new Error("Factory address not found")
	return await fetchEvents({ publicKey: factoryAddress }, url)
}

/**
 * Internal function to fetch all pool tokens.
 */
export const internal_fetchAllPoolTokens = async (network: Networks) => {
	const url = urls[network]
	const events = await internal_fetchAllPoolEvents(network)
	const promises = events.map(async (event) => {
		const data = event.events[0].data
		const poolAddress = PublicKey.fromFields([Field.from(data[2]), Field.from(data[3])])
		const tokenAddress = PublicKey.fromFields([Field.from(data[4]), Field.from(data[5])])
		const token = await fetchAccount({ publicKey: tokenAddress }, url)
		const symbol = token?.account?.tokenSymbol ?? "UNKNOWN_TOKEN_SYMBOL"
		return {
			address: tokenAddress.toBase58(),
			poolAddress: poolAddress.toBase58(),
			chainId: network,
			symbol,
			decimals: 9
		}
	})
	return await Promise.all(promises)
}

export const fetchPoolTokenList = async (network: Networks) => {
	const response = await fetch(`${luminaCdnOrigin}/api/${network}/tokens`)
	const tokens = await response.json() as TokenDbList
	return tokens
}
