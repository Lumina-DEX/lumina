import { unzipSync } from "fflate"
import { luminaCdnOrigin } from "../constants"
import { prefixedLogger } from "../helpers/logs"

type CachedFile = { file: string; data: Uint8Array }
type CacheList = Record<string, CachedFile>

const logger = prefixedLogger("[CACHE]")

export const createCacheList = (cacheList: CachedFile[]) =>
	cacheList.reduce((acc: CacheList, { file, data }) => {
		acc[file] = { file, data }
		return acc
	}, {})

const fetchWithRetry =
	(retries = 3) => async (url: string, options: RequestInit): Promise<Response> => {
		for (let i = 0; i < retries; i++) {
			try {
				const response = await fetch(url, options)
				if (response.ok) return response
			} catch (error) {
				if (i === retries - 1) throw error
				await new Promise(resolve => setTimeout(resolve, 500 * 2 ** i)) // Exponential backoff
			}
		}
		throw new Error("Max retries reached")
	}

/**
 * Fetch cache contracts one by one with Promise.all
 * @returns CacheList
 */
export const fetchCachedContracts = async () => {
	const headers = new Headers([["Content-Encoding", "br, gzip, deflate"]])
	const filesResponse = await fetch(`${luminaCdnOrigin}/api/cache`, { headers })
	const json = (await filesResponse.json()) as string[]
	const cacheList = await Promise.all(
		json
			.filter((x: string) => !x.includes("-pk-") && !x.includes(".header"))
			.map(async (file: string) => {
				const response = await fetchWithRetry(3)(`${luminaCdnOrigin}/cache/${file}.txt`, {
					headers
				})
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
export const fetchZippedContracts = async () => {
	const response = await fetch(`${luminaCdnOrigin}/bundle.zip`)
	if (!response.ok) throw new Error(`Failed to fetch contracts: ${response.statusText}`)
	const zipBuffer = await response.arrayBuffer()
	const data = unzipSync(new Uint8Array(zipBuffer as ArrayBufferLike)) as unknown as Record<
		string,
		Uint8Array
	>
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
