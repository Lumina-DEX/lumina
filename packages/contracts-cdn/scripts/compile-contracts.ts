import fs from "node:fs/promises"
import path from "node:path"
import { FungibleToken, Pool, PoolFactory, PoolTokenHolder } from "@lumina-dex/contracts"
import { Cache /*, Mina */, Mina } from "o1js"

const __dirname = path.dirname(new URL(import.meta.url).pathname)

// Ex: CACHE_DIR=cache/mainnet ou cache/testnet
const cacheDir = process.env.CACHE_DIR
	? path.resolve(process.cwd(), process.env.CACHE_DIR)
	: path.resolve(__dirname, "../cache")

await fs.mkdir(cacheDir, { recursive: true })

const cache = Cache.FileSystem(cacheDir)

export async function compileContracts() {
	console.log("Starting contract compilation :", { cacheDir })

	const networkType = process.env.NETWORK_TYPE ?? "testnet"
	Mina.setActiveInstance(
		Mina.Network({
			mina:
				networkType === "mainnet"
					? "https://api.minascan.io/archive/mainnet/v1/graphql"
					: "https://api.minascan.io/archive/devnet/v1/graphql",
			networkId: networkType === "mainnet" ? "mainnet" : "testnet"
		})
	)

	interface Contract {
		name: string
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
