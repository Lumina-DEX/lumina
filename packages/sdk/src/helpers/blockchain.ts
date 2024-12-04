import { fetchAccount, fetchEvents, Field, PublicKey } from "o1js"
import { luminadexFactories, urls } from "../constants"
import type { Networks } from "../machines/wallet"

/**
 * Internal function to fetch all pool events.
 */
export const fetchAllPoolEvents = async (network: Networks) => {
	const url = urls[network]
	const factoryAddress = luminadexFactories[network as "mina:testnet"] // TODO: Support all factories
	if (!factoryAddress) throw new Error("Factory address not found")
	return await fetchEvents({ publicKey: factoryAddress }, url)
}

/**
 * Internal function to fetch all pool tokens.
 */
export const fetchAllPoolTokens = async (network: Networks) => {
	const url = urls[network]
	const events = await fetchAllPoolEvents(network)
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
