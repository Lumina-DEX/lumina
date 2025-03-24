import { FungibleToken, PoolFactory } from "@lumina-dex/contracts"
import {
	fetchAccount,
	fetchEvents,
	fetchLastBlock,
	Field,
	Mina,
	PublicKey,
	TokenId,
	UInt32
} from "o1js"
import { archiveUrls, luminaCdnOrigin, luminadexFactories, startBlock, urls } from "../constants"
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

const processSettledPromises = <T>(settledPromises: PromiseSettledResult<T>[]) => {
	return settledPromises.flatMap((result) => {
		if (result.status === "rejected") throw new Error(result.reason)
		return result.value
	})
}

export const minaNetwork = (network: Networks) =>
	Mina.Network({
		networkId: network.includes("mainnet") ? "mainnet" : "testnet",
		mina: urls[network],
		archive: archiveUrls[network]
	})

const fetchEventsByBlockspace = async <T>(
	{ blockFetch, network, blockSpace = 10_000, from }: {
		blockFetch: (from: UInt32, to: UInt32) => Promise<T[]>
		network: Networks
		blockSpace?: number
		from?: number
	}
) => {
	const firstBlock = from ?? startBlock[network]
	const currentBlock = await fetchLastBlock()
	const nbToFetch = Math.ceil(
		(Number(currentBlock.blockchainLength.toBigint()) - firstBlock) / blockSpace
	)
	const tokenPromises = Array.from({ length: nbToFetch }, (_, index) =>
		blockFetch(
			UInt32.from(firstBlock + index * blockSpace),
			UInt32.from(firstBlock + (index + 1) * blockSpace)
		))
	console.log(
		`Fetching ${nbToFetch} blocks from ${firstBlock} to ${currentBlock.blockchainLength}, ${tokenPromises.length} promises.`
	)
	const events = await Promise.allSettled(tokenPromises)
		.then((results) =>
			results.flatMap((result) => result.status === "fulfilled" ? result.value : [])
		)
	return {
		events,
		startBlock: firstBlock,
		currentBlock: Number(currentBlock.blockchainLength.toBigint())
	}
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
 * Internal function to fetch all pool events from the contract.
 */
export const internal_fetchAllPoolFactoryEvents = async (
	{ network, factory, from }: { network: Networks; factory?: string; from?: number }
) => {
	Mina.setActiveInstance(minaNetwork(network))
	const factoryAddress = factory ?? luminadexFactories[network]
	const zkFactory = new PoolFactory(PublicKey.fromBase58(factoryAddress))
	const tokenList = await fetchEventsByBlockspace({
		blockFetch: zkFactory.fetchEvents.bind(zkFactory),
		network,
		from
	})
	return tokenList
}

/**
 * Internal function to fetch all tokens from the pool factory.
 */
export const internal_fetchAllTokensFromPoolFactory = async (
	{ network, factory, from }: { network: Networks; factory?: string; from?: number }
) => {
	const { events, currentBlock, startBlock } = await internal_fetchAllPoolFactoryEvents({
		network,
		factory,
		from
	})
	Mina.setActiveInstance(minaNetwork(network))
	const promises = events.filter(event => event.type === "poolAdded").map(async (event) => {
		const data = event.event.data as unknown as PoolAddedEventData
		const { poolAddress, token1Address } = data
		return await toTokens({ poolAddress, token1Address, network })
	})
	const settledTokens = await Promise.allSettled(promises)
	const tokens = processSettledPromises(settledTokens)
	return { tokens, startBlock, currentBlock }
}

/**
 * Fetches the token list from the CDN.
 */
export const fetchPoolTokenList = async (network: Networks) => {
	const response = await fetch(`${luminaCdnOrigin}/api/${network}/tokens`)
	const tokens = await response.json() as TokenDbList
	return tokens
}

/**
 * Internal function to fetch all pool events.
 * @deprecated Use `internal_fetchAllPoolFactoryEvents` instead.
 */
export const internal_fetchAllPoolEvents = async (network: Networks) => {
	const endpoint = archiveUrls[network]
	Mina.setActiveInstance(minaNetwork(network))
	const factoryAddress = luminadexFactories[network]
	if (!factoryAddress) throw new Error("Factory address not found")

	const blockFetch = async (from: UInt32, to: UInt32) =>
		fetchEvents({ publicKey: factoryAddress }, endpoint, { from, to })

	const tokenList = await fetchEventsByBlockspace({
		blockFetch,
		network
	})
	return tokenList
}

/**
 * Internal function to fetch all pool tokens.
 * @deprecated Use `internal_fetchAllTokensFromPoolFactory` instead.
 */
export const internal_fetchAllPoolTokens = async (network: Networks) => {
	Mina.setActiveInstance(minaNetwork(network))
	const { events, currentBlock, startBlock } = await internal_fetchAllPoolEvents(network)
	// console.log({ events })
	// console.log(JSON.stringify(events))
	// console.log("Event data:", events.map((event) => event.events[0].data))
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

	const promises = events.filter(event => event.events[0].data.length === 11).map(async (event) => {
		const data = event.events[0].data
		// console.log({ data })
		const { poolAddress, token1Address } = parsePoolEvents(data)
		return await toTokens({ poolAddress, token1Address, network })
	})
	const settledTokens = await Promise.allSettled(promises)
	const tokens = processSettledPromises(settledTokens)
	return { tokens, currentBlock, startBlock }
}
