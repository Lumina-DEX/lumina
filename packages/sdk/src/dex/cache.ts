import { unzipSync } from "fflate"
import { contractsVersion, luminaCdnOrigin } from "../constants"
import { prefixedLogger } from "../helpers/debug"

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

// Keep legacy behavior as default (devnet/testnet bundle path)
const networkToPathPrefix = (network?: string) => {
	// If no network is provided, keep backward compatibility (legacy testnet/devnet assets)
	if (!network) return ""

	// Standardize "mina:mainnet" => "mina_mainnet" (matches your Worker routing + build output)
	const standardized = network.replace(":", "_")

	// Only mainnet is stored under a subfolder; everything else stays in the legacy location
	// (devnet/testnet networks all share the same proving keys for now)
	return network.includes("mainnet") ? `/${standardized}` : ""
}

/**
 * Fetch cache contracts one by one with Promise.all
 * @returns CacheList
 */
export const fetchCachedContracts = async (network?: string) => {
	// Client should send Accept-Encoding (not Content-Encoding)
	const headers = new Headers([["Accept-Encoding", "br, gzip, deflate"]])

	// New route when network is provided:
	//   /api/manifest/:network/vX
	// Legacy route when network is not provided:
	//   /api/manifest/vX
	const manifestUrl = network
		? `${luminaCdnOrigin}/api/manifest/${network}/v${contractsVersion}`
		: `${luminaCdnOrigin}/api/manifest/v${contractsVersion}`

	const manifest = await fetch(manifestUrl, { headers })
	if (!manifest.ok) throw new Error(`Failed to fetch manifest: ${manifest.statusText}`)

	const json = (await manifest.json()) as { cache: string[] }

	// Assets are versioned, and mainnet lives in /mina_mainnet/vX/...
	const prefix = networkToPathPrefix(network)
	const base = `${luminaCdnOrigin}${prefix}/v${contractsVersion}`

	const cacheList = await Promise.all(
		json.cache
			.filter((x: string) => !x.includes("-pk-") && !x.includes(".header"))
			.map(async (file: string) => {
				const response = await fetchWithRetry(3)(`${base}/cache/${file}.txt`, { headers })
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
export const fetchZippedContracts = async (network?: string) => {
	const prefix = networkToPathPrefix(network)
	const url = `${luminaCdnOrigin}${prefix}/v${contractsVersion}/bundle.zip`

	const response = await fetch(url)
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
			return files[id].data
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
