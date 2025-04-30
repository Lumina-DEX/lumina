import { FungibleToken, PoolFactory } from "@lumina-dex/contracts"
import { fetchAccount, fetchLastBlock, Field, Mina, PublicKey, TokenId, UInt32 } from "o1js"
import { archiveUrls, luminaCdnOrigin, luminadexFactories, startBlock, urls } from "../constants"
import { FetchZekoEvents } from "../graphql/zeko"
import { createMinaClient } from "../machines"
import type { Networks } from "../machines/wallet/machine"

export interface LuminaPool {
	address: string
	tokens: [LuminaToken, LuminaToken]
	chainId: string
	name: string
}

export interface LuminaToken {
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
	tokens: LuminaToken[]
}

export interface PoolDbList {
	name: string
	timestamp: string
	version: {
		major: number
		minor: number
		patch: number
	}
	keywords: string[]
	pools: LuminaPool[]
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
	{ eventFetch, network, blockScanRange = 10_000, from }: {
		eventFetch: (from: UInt32, to: UInt32) => Promise<T[]>
		network: Networks
		blockScanRange?: number
		from?: number
	}
) => {
	const firstBlock = from ?? startBlock[network]
	const currentBlock = await fetchLastBlock()
	const nbToFetch = Math.ceil(
		(Number(currentBlock.blockchainLength.toBigint()) - firstBlock) / blockScanRange
	)
	const tokenPromises = Array.from({ length: nbToFetch }, (_, index) =>
		eventFetch(
			UInt32.from(firstBlock + index * blockScanRange),
			UInt32.from(firstBlock + (index + 1) * blockScanRange)
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

const getTokensAndPoolsFromPoolData = async (
	{ poolData, network }: { poolData: PoolAddedEventData[]; network: Networks }
) => {
	const toToken = async ({ poolAddress, tokenAddress, network }: {
		poolAddress: PublicKey
		tokenAddress: PublicKey
		network: Networks
	}): Promise<LuminaToken> => {
		if (tokenAddress.toBase58() === "B62qiTKpEPjGTSHZrtM8uXiKgn8So916pLmNJKDhKeyBQL9TDb3nvBG") {
			return {
				address: tokenAddress.toBase58(),
				poolAddress: poolAddress.toBase58(),
				tokenId: "MINA",
				chainId: network,
				symbol: "MINA",
				decimals: 9
			}
		}
		const token = await fetchAccount({ publicKey: tokenAddress })
		if (token.error) throw token.error
		const symbol = token?.account?.tokenSymbol ?? "UNKNOWN_TOKEN_SYMBOL"
		const tokenId = TokenId.toBase58(new FungibleToken(tokenAddress).deriveTokenId())

		return {
			address: tokenAddress.toBase58(),
			poolAddress: poolAddress.toBase58(),
			tokenId,
			chainId: network,
			symbol,
			decimals: 9
		}
	}

	const toPool = async ({ poolAddress, token0, token1, network }: {
		poolAddress: PublicKey
		token0: LuminaToken
		token1: LuminaToken
		network: Networks
	}): Promise<LuminaPool> => ({
		address: poolAddress.toBase58(),
		tokens: [token0, token1],
		chainId: network,
		name: `${token0.symbol}_${token1.symbol}-LLP`
	})

	const pools = new Map<string, LuminaPool>()
	const tokens = new Map<string, LuminaToken>()

	// Collect unique token fetches
	const tokenFetches = []
	for (const { poolAddress, token0Address, token1Address } of poolData) {
		for (const addr of [token0Address, token1Address]) {
			const key = addr.toBase58()
			if (!tokens.has(key)) {
				tokenFetches.push(
					toToken({ poolAddress, tokenAddress: addr, network })
						.then(token => ({ key, token }))
				)
			}
		}
	}
	for (const { key, token } of processSettledPromises(await Promise.allSettled(tokenFetches))) {
		tokens.set(key, token)
	}

	// Collect pool fetches
	const poolFetches = poolData.map(({ poolAddress, token0Address, token1Address }) => {
		const token0 = tokens.get(token0Address.toBase58())
		const token1 = tokens.get(token1Address.toBase58())
		if (!token0 || !token1) return null
		return toPool({ poolAddress, token0, token1, network })
			.then(pool => ({ key: poolAddress.toBase58(), pool }))
	}).filter(Boolean)

	for (const { key, pool } of processSettledPromises(await Promise.allSettled(poolFetches))) {
		pools.set(key, pool)
	}

	return { pools, tokens }
}

const processTypedEvents = async (
	{ events, network }: {
		network: Networks
		events: Awaited<ReturnType<typeof internal_fetchAllPoolFactoryEvents>>["events"]
	}
) => {
	const poolData = events.filter(event => event.type === "poolAdded").map((event) => {
		return event.event.data as unknown as PoolAddedEventData
	})
	const { pools, tokens } = await getTokensAndPoolsFromPoolData({ poolData, network })
	return { pools, tokens }
}

const processRawEvents = async (
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
 * Fetch pools and tokens from the pool factory.
 */
export const fetchAllFromPoolFactory = async (
	{ network, factory, from }: { network: Networks; factory?: string; from?: number }
) => {
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
	{ network, factory, from }: { network: Networks; factory?: string; from?: number }
) => {
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
	{ network, factory, from }: { network: Networks; factory?: string; from?: number }
) => {
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
export const fetchTokenList = async (network: Networks) => {
	const response = await fetch(`${luminaCdnOrigin}/api/${network}/tokens`)
	const tokens = await response.json() as TokenDbList
	return tokens
}

// TODO: To implement
export const fetchPoolList = async (network: Networks) => {
	// const response = await fetch(`${luminaCdnOrigin}/api/${network}/pools`)
	// const pools = await response.json()
	// return pools
}
