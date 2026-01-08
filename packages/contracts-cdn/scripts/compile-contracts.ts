import fs from "node:fs/promises"
import path from "node:path"
import { FungibleToken, Pool, PoolFactory, PoolTokenHolder } from "@lumina-dex/contracts"
import { archiveUrls, networks } from "@lumina-dex/sdk/constants"
import { Cache, Mina } from "o1js"

const __dirname = path.dirname(new URL(import.meta.url).pathname)

const network = (process.argv[2] ?? "mina:devnet") as (typeof networks)[number]
const isValidNetwork = networks.includes(network)
if (!isValidNetwork) throw new Error(`Invalid network argument. Expected one of: ${networks.join(", ")}`)

const cacheDir = path.resolve(__dirname, "../cache", network)

await fs.mkdir(cacheDir, { recursive: true })

const cache = Cache.FileSystem(cacheDir)

export async function compileContracts() {
	console.log("Starting contract compilation :", { cacheDir, network })

	Mina.setActiveInstance(
		Mina.Network({
			mina: archiveUrls[network],
			networkId: network === "mina:mainnet" ? "mainnet" : "testnet"
		})
	)

	interface Contract {
		name: string
		compile: ({ cache }: { cache: Cache }) => Promise<unknown>
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
