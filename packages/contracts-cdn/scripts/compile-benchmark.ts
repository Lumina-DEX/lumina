import { unzipSync } from "fflate"
import type { Cache } from "o1js"
import { createCacheList, fetchCachedContracts, readCache } from "../../sdk/src/dex/cache"

interface Contract {
	name: string
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	compile: ({ cache }: { cache: Cache }) => Promise<any>
}

// Compile Contracts
const createCt = (cache: Cache) => async (contract: Contract) => {
	console.log(`Compiling ${contract.name}`)
	console.time(contract.name)
	await contract.compile({ cache })
	console.timeEnd(contract.name)
}

async function compileContracts(cache: Cache) {
	const { Faucet, FungibleToken, FungibleTokenAdmin, Pool, PoolFactory, PoolTokenHolder } =
		await import("@lumina-dex/contracts")

	const ct = createCt(cache)
	console.time("CompileContracts")
	await ct(PoolFactory)
	await ct(Pool)
	await ct(FungibleToken)
	await ct(FungibleTokenAdmin)
	await ct(PoolTokenHolder)
	await ct(Faucet)
	console.timeEnd("CompileContracts")
}

async function individualFiles() {
	console.time("[BENCH] IndividualFiles")
	console.time("[BENCH] FetchCachedContracts")
	const files = await fetchCachedContracts()
	const cache = readCache(files)
	console.timeEnd("[BENCH] FetchCachedContracts")
	await compileContracts(cache)
	console.timeEnd("[BENCH] IndividualFiles")
}

async function zipFiles() {
	console.time("[BENCH] ZipFiles")
	console.time("[BENCH] FetchZipContracts")
	const files = await cacheFromZip(await zipFileRemote())
	const cache = readCache(files)
	console.timeEnd("[BENCH] FetchZipContracts")
	await compileContracts(cache)
	console.timeEnd("[BENCH] ZipFiles")
}

async function cacheFromZip(data: Record<string, Uint8Array>) {
	const cacheList = Object.entries(data).map(([file, data]) => ({
		file: file.split(".")[0],
		data: new Uint8Array(data)
	}))
	const files = createCacheList(cacheList)
	return files
}

async function zipFileRemote() {
	console.time("FetchZippedContracts")
	const response = await fetch("https://luminadex-contracts-cdn.hebilicious.workers.dev/bundle.zip")
	if (!response.ok) throw new Error(`Failed to fetch contracts: ${response.statusText}`)
	const zipBuffer = await response.arrayBuffer()
	const data = unzipSync(new Uint8Array(zipBuffer as ArrayBufferLike)) as unknown as Record<
		string,
		Uint8Array
	>
	return data
}

await individualFiles()
await zipFiles()
