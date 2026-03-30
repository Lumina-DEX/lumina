import fs from "node:fs/promises"
import path from "node:path"
import { archiveUrls, networks } from "@lumina-dex/sdk/constants"
import { Cache, Mina } from "o1js"
import { cdnContracts } from "./contracts.ts"

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

	const ct = async (contract: (typeof cdnContracts)[number]["contract"]) => {
		console.log(`Compiling ${contract.name}`)
		console.time(contract.name)
		await contract.compile({ cache })
		console.timeEnd(contract.name)
	}

	for (const { contract } of cdnContracts) {
		await ct(contract)
	}

	console.log("Compilation done")
}

console.time("start")
await compileContracts()
console.timeEnd("start")
