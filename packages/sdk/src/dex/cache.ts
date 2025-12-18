import { unzipSync } from "fflate"
import { contractsVersion, luminaCdnOrigin } from "../constants"
import { prefixedLogger } from "../helpers/debug"
import type { Networks } from "../machines/wallet/types"

type CachedFile = { file: string; data: Uint8Array }
type CacheList = Record<string, CachedFile>

const logger = prefixedLogger("[CACHE]")

export const createCacheList = (cacheList: CachedFile[]) =>
	cacheList.reduce((acc: CacheList, { file, data }) => {
		acc[file] = { file, data }
		return acc
	}, {})

const fetchWithRetry =
	(retries = 3) =>
	async (url: string, options: RequestInit): Promise<Response> => {
		for (let i = 0; i < retries; i++) {
			try {
				const response = await fetch(url, options)
				if (response.ok) return response
			} catch (error) {
				if (i === retries - 1) throw error
				await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** i)) // Exponential backoff
			}
		}
		throw new Error("Max retries reached")
	}

const getNetworkType = (network?: string): "mainnet" | "testnet" =>
	network?.includes("mainnet") ? "mainnet" : "testnet"

/**
 * Fetch cache contracts one by one with Promise.all
 * @returns CacheList
 */
export const fetchCachedContracts = async (network?: string) => {
	const headers = new Headers([["Content-Encoding", "br, gzip, deflate"]])
	const networkType = getNetworkType(network)

	// Manifest is selected by `?network=...`
	const manifestUrl = new URL(`${luminaCdnOrigin}/api/manifest/v${contractsVersion}`)
	if (network) manifestUrl.searchParams.set("network", network)

	const manifest = await fetch(manifestUrl.toString(), { headers })
	if (!manifest.ok) throw new Error(`Failed to fetch manifest: ${manifest.statusText}`)

	const json = (await manifest.json()) as { cache: string[] }

	const cacheList = await Promise.all(
		json.cache
			.filter((x: string) => !x.includes("-pk-") && !x.includes(".header"))
			.map(async (file: string) => {
				const response = await fetchWithRetry(3)(
					`${luminaCdnOrigin}/${networkType}/v${contractsVersion}/cache/${file}.txt`,
					{ headers }
				)
				return {
					file,
					data: new Uint8Array(await response.arrayBuffer())
				}
			})
	)

	return createCacheList(cacheList)
}

type CacheData = {
	persistentId: string
	uniqueId: string
	dataType: "string" | "bytes"
}

/**
 * Fetch zipped contracts and unzip them. This is faster than fetchCachedContracts.
 * @returns CacheList
 */
export const fetchZippedContracts = async (network?: Networks) => {
	const networkType = getNetworkType(network)

	const response = await fetch(`${luminaCdnOrigin}/${networkType}/v${contractsVersion}/bundle.zip`)
	if (!response.ok) throw new Error(`Failed to fetch contracts: ${response.statusText}`)

	const zipBuffer = await response.arrayBuffer()
	const data = unzipSync(new Uint8Array(zipBuffer as ArrayBufferLike)) as unknown as Record<string, Uint8Array>

	const cacheList = Object.entries(data).map(([file, data]) => ({
		file: file.split(".")[0],
		data: new Uint8Array(data)
	}))

	return createCacheList(cacheList)
}

export const readCache = (files: CacheList) => ({
	read({ persistentId, dataType }: CacheData) {
		const id = persistentId.replaceAll("_", "")
		if (!files[id]) {
			logger.warn(`${id} not found.`)
			return undefined
		}

		if (dataType === "string") {
			logger.debug(`${id} found.`)
			const data = files[id].data
			return data
		}
		logger.error(`${id} data type is not a string : not supported.`)
		return undefined
	},
	write({ persistentId, uniqueId, dataType }: CacheData) {
		logger.warn("writing to the cache, this should not happen.", {
			persistentId,
			uniqueId,
			dataType
		})
	},
	canWrite: false
})
