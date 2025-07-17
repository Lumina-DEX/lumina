import { PoolFactory } from "@lumina-dex/contracts"
import { fetchAccount, fetchLastBlock, Field, Mina, PublicKey, TokenId, UInt32 } from "o1js"
import pLimit from "p-limit"
import { archiveUrls, luminaCdnOrigin, luminadexFactories, startBlock, urls } from "../constants"
import { FetchZekoEvents } from "../graphql/zeko"
import { createMinaClient } from "../machines"
import { prefixedLogger } from "./debug"

import type { SupportedNetwork } from "../constants"
export interface LuminaPool {
	address: string
	tokenId: string
	tokens: [LuminaToken, LuminaToken]
	chainId: SupportedNetwork
	name: string
}

export interface LuminaToken {
	address: string
	chainId: SupportedNetwork
	tokenId: string
	symbol: string
	decimals: number
}

interface PoolAddedEventData {
	sender: PublicKey
	signer: PublicKey
	poolAddress: PublicKey
	token0Address: PublicKey
	token1Address: PublicKey
}

const logger = prefixedLogger("[Blockchain]")

const processSettledPromises = <T>(settledPromises: PromiseSettledResult<T>[]) => {
	return settledPromises.flatMap((result) => {
		if (result.status === "rejected") throw new Error(result.reason)
		return result.value
	})
}

export const minaNetwork = (network: SupportedNetwork) =>
	Mina.Network({
		networkId: network.includes("mainnet") ? "mainnet" : "testnet",
		mina: urls[network],
		archive: archiveUrls[network]
	})

const fetchEventsByBlockspace = async <T>(
	{ eventFetch, network, blockScanRange = 10_000, from }: {
		eventFetch: (from: UInt32, to: UInt32) => Promise<T[]>
		network: SupportedNetwork
		blockScanRange?: number
		from?: number
	}
) => {
	logger.start("fetchEventsByBlockspace", { network, blockScanRange, from })
	// Concurrency limit
	const limit = pLimit(10)

	const firstBlock = from ?? startBlock[network]
	const currentBlock = await fetchLastBlock()
	const nbToFetch = Math.ceil(
		(Number(currentBlock.blockchainLength.toBigint()) - firstBlock) / blockScanRange
	)

	const tokenPromises = Array.from({ length: nbToFetch }, (_, index) =>
		limit(() =>
			eventFetch(
				UInt32.from(firstBlock + index * blockScanRange),
				UInt32.from(firstBlock + (index + 1) * blockScanRange)
			)
		))
	logger.info(
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

const getTokensAndPoolsFromPoolData = async (
	{ poolData, network }: { poolData: PoolAddedEventData[]; network: SupportedNetwork }
) => {
	logger.start("getTokensAndPoolsFromPoolData", { network, poolData: poolData.length })
	// Concurrency limit
	const limit = pLimit(10)

	const toTokenId = (address: PublicKey) => TokenId.toBase58(TokenId.derive(address))
	const toToken = async ({ tokenAddress, network }: {
		tokenAddress: PublicKey
		network: SupportedNetwork
	}): Promise<LuminaToken> => {
		// MINA token address is empty
		if (tokenAddress.isEmpty().toBoolean()) {
			return {
				address: tokenAddress.toBase58(),
				tokenId: "MINA",
				chainId: network,
				symbol: "MINA",
				decimals: 9
			}
		}
		const token = await fetchAccount({ publicKey: tokenAddress })
		if (token.error) throw token.error
		const symbol = token?.account?.tokenSymbol ?? "UNKNOWN_TOKEN_SYMBOL"

		return {
			address: tokenAddress.toBase58(),
			tokenId: toTokenId(tokenAddress),
			chainId: network,
			symbol,
			decimals: 9
		}
	}

	const pools = new Map<string, LuminaPool>()
	const tokens = new Map<string, LuminaToken>()

	const uniqueTokens = new Set<string>()
	// Collect unique token fetches
	const tokenFetches: Promise<{ key: string; token: LuminaToken }>[] = []
	for (const { token0Address, token1Address } of poolData) {
		for (const address of [token0Address, token1Address]) {
			const key = address.toBase58()
			if (!uniqueTokens.has(key)) {
				tokenFetches.push(
					limit(() =>
						toToken({ tokenAddress: address, network })
							.then((token) => ({ key, token }))
					)
				)
				uniqueTokens.add(key)
			}
		}
	}
	for (const { key, token } of processSettledPromises(await Promise.allSettled(tokenFetches))) {
		tokens.set(key, token)
	}

	for (const { poolAddress, token0Address, token1Address } of poolData) {
		const token0 = tokens.get(token0Address.toBase58())
		const token1 = tokens.get(token1Address.toBase58())
		if (token0 && token1) {
			pools.set(poolAddress.toBase58(), {
				address: poolAddress.toBase58(),
				tokens: [token0, token1],
				tokenId: toTokenId(poolAddress),
				chainId: network,
				name: `LLP-${token0.symbol}_${token1.symbol}`
			})
		}
	}

	return { pools, tokens }
}

const processTypedEvents = async (
	{ events, network }: {
		network: SupportedNetwork
		events: Awaited<ReturnType<typeof internal_fetchAllPoolFactoryEvents>>["events"]
	}
) => {
	logger.start("processTypedEvents", { network, events: events.length })
	const poolData = events.filter(event => event.type === "poolAdded").map((event) => {
		return event.event.data as unknown as PoolAddedEventData
	})
	const { pools, tokens } = await getTokensAndPoolsFromPoolData({ poolData, network })
	return { pools, tokens }
}

const processRawEvents = async (
	{ events, network }: {
		network: SupportedNetwork
		events: Awaited<ReturnType<typeof internal_fetchAllZekoPoolFactoryEvents>>["events"]
	}
) => {
	logger.start("processRawEvents", { network, events: events.length })
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
	// TODO: Find out if there's a more robust way to filter the events than their length
	const poolData = events.filter(event => event.eventData[0].data.length === 11).map((event) => {
		const data = event.eventData[0].data
		return parsePoolEvents(data)
	})

	const { pools, tokens } = await getTokensAndPoolsFromPoolData({ poolData, network })
	return { pools, tokens }
}

/**
 * Internal function to fetch all pool events from a contract, using the archive node API.
 */
export const internal_fetchAllPoolFactoryEvents = async (
	{ network, factory, from }: { network: SupportedNetwork; factory?: string; from?: number }
) => {
	logger.start("internal_fetchAllPoolFactoryEvents", { network, factory, from })
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
export const internal_fetchAllZekoPoolFactoryEvents = async (network: SupportedNetwork) => {
	logger.start("internal_fetchAllZekoPoolFactoryEvents", { network })
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
 * Fetch pools and tokens from the pool factory.
 */
export const fetchAllFromPoolFactory = async (
	{ network, factory, from }: { network: SupportedNetwork; factory?: string; from?: number }
) => {
	logger.start("fetchAllFromPoolFactory", { network, factory, from })
	Mina.setActiveInstance(minaNetwork(network))
	if (network.includes("zeko")) {
		const { events, currentBlock, startBlock } = await internal_fetchAllZekoPoolFactoryEvents(
			network
		)
		const { tokens, pools } = await processRawEvents({ events, network })
		return { tokens, pools, startBlock, currentBlock }
	}
	const { events, currentBlock, startBlock } = await internal_fetchAllPoolFactoryEvents({
		network,
		factory,
		from
	})
	const { tokens, pools } = await processTypedEvents({ events, network })
	return { tokens, pools, startBlock, currentBlock }
}

/**
 * Fetch all tokens from the pool factory.
 */
export const fetchAllTokensFromPoolFactory = async (
	{ network, factory, from }: { network: SupportedNetwork; factory?: string; from?: number }
) => {
	logger.start("fetchAllTokensFromPoolFactory", { network, factory, from })
	const { tokens, startBlock, currentBlock } = await fetchAllFromPoolFactory({
		network,
		factory,
		from
	})
	return { tokens, startBlock, currentBlock }
}

/**
 * Fetch all pools from the pool factory.
 */
export const fetchAllPoolsFromPoolFactory = async (
	{ network, factory, from }: { network: SupportedNetwork; factory?: string; from?: number }
) => {
	logger.start("fetchAllPoolsFromPoolFactory", { network, factory, from })
	const { pools, startBlock, currentBlock } = await fetchAllFromPoolFactory({
		network,
		factory,
		from
	})
	return { pools, startBlock, currentBlock }
}

/**
 * Fetches the token list from the CDN.
 */
export const fetchTokenList = async (network: SupportedNetwork) => {
	const response = await fetch(`${luminaCdnOrigin}/api/${network}/tokens`)
	const tokens = await response.json() as LuminaToken[]
	return tokens
}

/**
 * Fetches the pool list from the CDN.
 */
export const fetchPoolList = async (network: SupportedNetwork) => {
	const response = await fetch(`${luminaCdnOrigin}/api/${network}/pools`)
	const pools = await response.json() as LuminaPool[]
	return pools
}
