import { FungibleToken } from "@lumina-dex/contracts"
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

const minaNetwork = (network: Networks) =>
	Mina.Network({
		networkId: network.includes("mainnet") ? "mainnet" : "testnet",
		mina: urls[network],
		archive: archiveUrls[network]
	})
/**
 * Internal function to fetch all pool events.
 */
export const internal_fetchAllPoolEvents = async (network: Networks) => {
	Mina.setActiveInstance(minaNetwork(network))
	const factoryAddress = luminadexFactories[network as "mina:testnet"] // TODO: Support all factories
	if (!factoryAddress) throw new Error("Factory address not found")
	return await fetchEvents({ publicKey: factoryAddress })
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
	}) as {
		sender: PublicKey
		signer: PublicKey
		poolAddress: PublicKey
		token0Address: PublicKey
		token1Address: PublicKey
	}
}
/**

 * Internal function to fetch all pool tokens.
 */
export const internal_fetchAllPoolTokens = async (network: Networks) => {
	const events = await internal_fetchAllPoolEvents(network)
	console.log(JSON.stringify(events))
	Mina.setActiveInstance(minaNetwork(network))
	// Compiling appears to be optional to derive the token ID.
	// const cacheFiles = await fetchZippedContracts()
	// const cache = readCache(cacheFiles)
	// const tokenContract = FungibleToken
	console.log("Event data:", events.map((event) => event.events[0].data))
	const promises = events.map(async (event) => {
		const data = event.events[0].data
		console.log({ data })
		const { poolAddress, token1Address } = parsePoolEvents(data)
		// console.log([poolAddress.toJSON(), token1Address.toJSON()])
		const pool = await fetchAccount({ publicKey: poolAddress })
		const token = await fetchAccount({ publicKey: token1Address })
		// console.log({ pool, token })
		if (pool.error) throw pool.error
		if (token.error) throw token.error
		const symbol = token?.account?.tokenSymbol ?? "UNKNOWN_TOKEN_SYMBOL"
		const tokenId = TokenId.toBase58(new FungibleToken(token1Address).deriveTokenId())
		console.log({ tokenId, symbol })

		return {
			address: token1Address.toBase58(),
			poolAddress: poolAddress.toBase58(),
			tokenId,
			chainId: network,
			symbol,
			decimals: 9
		}
	})
	return await Promise.allSettled(promises)
}

export const fetchPoolTokenList = async (network: Networks) => {
	const response = await fetch(`${luminaCdnOrigin}/api/${network}/tokens`)
	const tokens = await response.json() as TokenDbList
	return tokens
}
