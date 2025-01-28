import { FungibleToken, PoolFactory } from "@lumina-dex/contracts"
import { fetchAccount, fetchEvents, Field, Mina, PublicKey, TokenId } from "o1js"
import { archiveUrls, luminaCdnOrigin, luminadexFactories, urls } from "../constants"
import type { Networks } from "../machines/wallet/machine"

export interface TokenDbToken {
	address: string
	poolAddress: string
	chainId: string
	tokenId: string
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

interface PoolAddedEventData {
	sender: PublicKey
	signer: PublicKey
	poolAddress: PublicKey
	token0Address: PublicKey
	token1Address: PublicKey
}

const minaNetwork = (network: Networks) =>
	Mina.Network({
		networkId: network.includes("mainnet") ? "mainnet" : "testnet",
		mina: urls[network],
		archive: archiveUrls[network]
	})

/**
 * Internal function to fetch all pool events.
 * @deprecated Use `internal_fetchAllPoolFactoryEvents` instead.
 */
export const internal_fetchAllPoolEvents = async (network: Networks) => {
	Mina.setActiveInstance(minaNetwork(network))
	const factoryAddress = luminadexFactories[network as "mina:testnet"] // TODO: Support all factories
	if (!factoryAddress) throw new Error("Factory address not found")
	return await fetchEvents({ publicKey: factoryAddress })
}

/**
 * Internal function to fetch all pool events from the contract.
 */
export const internal_fetchAllPoolFactoryEvents = async (
	{ network, factory }: { network: Networks; factory?: string }
) => {
	Mina.setActiveInstance(minaNetwork(network))
	const factoryAddress = factory ?? luminadexFactories[network as "mina:testnet"] // TODO: Support all factories
	const zkFactory = new PoolFactory(PublicKey.fromBase58(factoryAddress))
	return await zkFactory.fetchEvents()
}

const parsePoolEvents = (data: string[]) => {
	const pubk = (a: number, b: number) => {
		return PublicKey.fromFields([Field.from(data[a]), Field.from(data[b])])
	}

	return new Proxy({}, {
		get: (_, prop: string) => {
			return {
				get sender() {
					return pubk(1, 2)
				},
				get signer() {
					return pubk(3, 4)
				},
				get poolAddress() {
					return pubk(5, 6)
				},
				get token0Address() {
					return pubk(7, 8)
				},
				get token1Address() {
					return pubk(9, 10)
				}
			}[prop]
		}
	}) as PoolAddedEventData
}

const toTokens = async (
	{ poolAddress, token1Address, network }: {
		poolAddress: PublicKey
		token1Address: PublicKey
		network: Networks
	}
) => {
	// // console.log([poolAddress.toJSON(), token1Address.toJSON()])
	const token = await fetchAccount({ publicKey: token1Address })
	if (token.error) throw token.error
	const symbol = token?.account?.tokenSymbol ?? "UNKNOWN_TOKEN_SYMBOL"
	const tokenId = TokenId.toBase58(new FungibleToken(token1Address).deriveTokenId())
	// // console.log({ tokenId, symbol })

	return {
		address: token1Address.toBase58(),
		poolAddress: poolAddress.toBase58(),
		tokenId,
		chainId: network,
		symbol,
		decimals: 9
	}
}

/**
 * Internal function to fetch all pool tokens.
 * @deprecated Use `internal_fetchAllTokensInPool` instead.
 */
export const internal_fetchAllPoolTokens = async (network: Networks) => {
	const events = await internal_fetchAllPoolEvents(network)
	console.log({ events })
	// console.log(JSON.stringify(events))
	Mina.setActiveInstance(minaNetwork(network))
	console.log("Event data:", events.map((event) => event.events[0].data))
	const promises = events.filter(event => event.events[0].data.length === 11).map(async (event) => {
		const data = event.events[0].data
		// console.log({ data })
		const { poolAddress, token1Address } = parsePoolEvents(data)
		return await toTokens({ poolAddress, token1Address, network })
	})
	return await Promise.allSettled(promises)
}

/**
 * Internal function to fetch all tokens from the pool factory.
 */
export const internal_fetchAllTokensFromPoolFactory = async (
	{ network, factory }: { network: Networks; factory?: string }
) => {
	const events = await internal_fetchAllPoolFactoryEvents({ network, factory })
	Mina.setActiveInstance(minaNetwork(network))
	const promises = events.filter(event => event.type === "poolAdded").map(async (event) => {
		const data = event.event.data as unknown as PoolAddedEventData
		const { poolAddress, token1Address } = data
		return await toTokens({ poolAddress, token1Address, network })
	})
	return await Promise.allSettled(promises)
}

/**
 * Fetches the token list from the CDN.
 */
export const fetchPoolTokenList = async (network: Networks) => {
	const response = await fetch(`${luminaCdnOrigin}/api/${network}/tokens`)
	const tokens = await response.json() as TokenDbList
	return tokens
}
