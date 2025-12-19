import fs from "node:fs/promises"
import path from "node:path"

import { FungibleToken, Pool, PoolFactory, PoolTokenHolder } from "@lumina-dex/contracts"
import { Cache } from "o1js"

const __dirname = path.dirname(new URL(import.meta.url).pathname)

export const cacheDir = path.resolve(__dirname, "../cache")
await fs.mkdir(cacheDir, { recursive: true })

const cache = Cache.FileSystem(cacheDir)

export async function compileContracts() {
	console.log("Starting contract compilation :")

	interface Contract {
		name: string
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		compile: ({ cache }: { cache: Cache }) => Promise<any>
	}

	const ct = async (contract: Contract) => {
		console.log(`Compiling ${contract.name}`)
		console.time(contract.name)
		await contract.compile({ cache })
		console.timeEnd(contract.name)
	}

	await ct(PoolFactory)
	await ct(Pool)
	await ct(PoolTokenHolder)
	await ct(FungibleToken)
	console.log("Compilation done")
}

console.time("start")
await compileContracts()
console.timeEnd("start")
