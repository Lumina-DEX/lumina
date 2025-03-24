import { FungibleToken, PoolFactory } from "@lumina-dex/contracts"
import { fetchAccount, fetchLastBlock, Field, Mina, PublicKey, TokenId, UInt32 } from "o1js"
import { archiveUrls, luminaCdnOrigin, luminadexFactories, startBlock, urls } from "../constants"
import { FetchZekoEvents } from "../graphql/zeko"
import { createMinaClient } from "../machines"
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
	{ eventFetch, network, blockSpace = 10_000, from }: {
		eventFetch: (from: UInt32, to: UInt32) => Promise<T[]>
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
		eventFetch(
			UInt32.from(firstBlock + index * blockSpace),
			UInt32.from(firstBlock + (index + 1) * blockSpace)
		))
	// console.log(
	// 	`Fetching ${nbToFetch} blocks from ${firstBlock} to ${currentBlock.blockchainLength}, ${tokenPromises.length} promises.`
	// )
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

const processTypedEvents = (
	{ events, network }: {
		network: Networks
		events: Awaited<ReturnType<typeof internal_fetchAllPoolFactoryEvents>>["events"]
	}
) => {
	return events.filter(event => event.type === "poolAdded").map(async (event) => {
		const data = event.event.data as unknown as PoolAddedEventData
		const { poolAddress, token1Address } = data
		return await toTokens({ poolAddress, token1Address, network })
	})
}

const processRawEvents = (
	{ events, network }: {
		network: Networks
		events: Awaited<ReturnType<typeof internal_fetchAllZekoPoolFactoryEvents>>["events"]
	}
) => {
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
	return events.filter(event => event.eventData[0].data.length === 11).map(async (event) => {
		const data = event.eventData[0].data
		// console.log({ data })
		const { poolAddress, token1Address } = parsePoolEvents(data)
		return await toTokens({ poolAddress, token1Address, network })
	})
}

/**
 * Internal function to fetch all pool events from a contract, using the archive node API.
 */
export const internal_fetchAllPoolFactoryEvents = async (
	{ network, factory, from }: { network: Networks; factory?: string; from?: number }
) => {
	Mina.setActiveInstance(minaNetwork(network))
	const factoryAddress = factory ?? luminadexFactories[network]
	const zkFactory = new PoolFactory(PublicKey.fromBase58(factoryAddress))
	const tokenList = await fetchEventsByBlockspace({
		eventFetch: zkFactory.fetchEvents.bind(zkFactory),
		network,
		from
	})
	return tokenList
}

/**
 * Internal function to fetch all zeko pool events using the sequencer API.
 * This exists because on Zeko there's no concept of blocks, and the events can be fetched directly from the sequencer.
 */
export const internal_fetchAllZekoPoolFactoryEvents = async (network: Networks) => {
	Mina.setActiveInstance(minaNetwork(network))
	const endpoint = urls[network]
	const factoryAddress = luminadexFactories[network]
	if (!factoryAddress) throw new Error("Factory address not found")
	const client = createMinaClient(endpoint)
	const { data } = await client.query(FetchZekoEvents, { eventInput: { address: factoryAddress } })
	if (!data) throw new Error("No data found")
	return { events: data.events, currentBlock: 0, startBlock: 0 }
}

/**
 * Internal function to fetch all tokens from the pool factory.
 */
export const internal_fetchAllTokensFromPoolFactory = async (
	{ network, factory, from }: { network: Networks; factory?: string; from?: number }
) => {
	Mina.setActiveInstance(minaNetwork(network))
	if (network.includes("zeko")) {
		const { events, currentBlock, startBlock } = await internal_fetchAllZekoPoolFactoryEvents(
			network
		)
		const settledTokens = await Promise.allSettled(processRawEvents({ events, network }))
		const tokens = processSettledPromises(settledTokens)
		return { tokens, startBlock, currentBlock }
	}
	const { events, currentBlock, startBlock } = await internal_fetchAllPoolFactoryEvents({
		network,
		factory,
		from
	})
	const settledTokens = await Promise.allSettled(processTypedEvents({ events, network }))
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
