import { unzipSync } from "fflate"
import { luminaCdnOrigin } from "../constants"

type CachedFile = { file: string; data: Uint8Array }
type CacheList = Record<string, CachedFile>

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

export const fetchCachedContracts = async () => {
	const headers = new Headers([["Content-Encoding", "br, gzip, deflate"]])

	console.time("Compiled Contracts")
	const filesResponse = await fetch(`${luminaCdnOrigin}/api/cache`, { headers })
	const json = (await filesResponse.json()) as string[]
	console.timeEnd("Compiled Contracts")

	console.time("CacheList")
	const cacheList = await Promise.all(
		json
			.filter((x: string) => !x.includes("-pk-") && !x.includes(".header"))
			.map(async (file: string) => {
				console.time(`Fetch ${file}`)
				const response = await fetchWithRetry(3)(`${luminaCdnOrigin}/cache/${file}.txt`, {
					headers
				})
				console.timeEnd(`Fetch ${file}`)
				return {
					file,
					data: new Uint8Array(await response.arrayBuffer())
				}
			})
	)
	console.timeEnd("CacheList")
	return createCacheList(cacheList)
}

type CacheData = {
	persistentId: string
	uniqueId: string
	dataType: "string" | "bytes"
}

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
		// console.time(`Load Cache ${persistentId}`)
		// read current uniqueId, return data if it matches
		if (!files[persistentId]) {
			console.log("not found : ", persistentId)
			// console.timeEnd(`Load Cache ${persistentId}`)
			return undefined
		}

		if (dataType === "string") {
			const data = files[persistentId].data
			// console.timeEnd(`Load Cache ${persistentId}`)
			return data
		}
		console.log("data type not string : ", persistentId)
		// console.timeEnd(`Load Cache ${persistentId}`)
		return undefined
	},
	write({ persistentId, uniqueId, dataType }: CacheData) {
		console.log("write", { persistentId, uniqueId, dataType })
	},
	canWrite: false
})
