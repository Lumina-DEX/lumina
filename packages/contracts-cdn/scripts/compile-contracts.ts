import fs from "node:fs/promises"
import path from "node:path"

import { FungibleToken, Pool, PoolFactory, PoolTokenHolder } from "@lumina-dex/contracts"
import { Cache, Mina } from "o1js"

const __dirname = path.dirname(new URL(import.meta.url).pathname)

/**
 * CLI:
 *   node ... compile-contracts.ts [network]
 *
 * Examples:
 *   mina:devnet   (default, legacy)
 *   mina:mainnet  (stored under cache/mina_mainnet)
 */
const network = (process.argv[2] ?? "mina:devnet").toLowerCase()

/**
 * Standardize network name for folder usage (ex: mina:mainnet -> mina_mainnet)
 */
const networkStandardized = network.replace(":", "_")

/**
 * Keep backward compatibility:
 * - devnet/testnet -> ../cache
 * - mina:mainnet   -> ../cache/mina_mainnet
 */
export const cacheDir = network.includes("mainnet")
	? path.resolve(__dirname, `../cache/${networkStandardized}`)
	: path.resolve(__dirname, "../cache")

await fs.mkdir(cacheDir, { recursive: true })

const cache = Cache.FileSystem(cacheDir)

function setMinaInstance(n: string) {
	const isMainnet = n.includes("mainnet")

	// These endpoints can be updated later if needed.
	Mina.setActiveInstance(
		Mina.Network({
			mina: isMainnet
				? "https://api.minascan.io/archive/mainnet/v1/graphql"
				: "https://api.minascan.io/archive/devnet/v1/graphql",
			networkId: isMainnet ? "mainnet" : "testnet"
		})
	)
}

export async function compileContracts() {
	console.log("Starting contract compilation:", {
		network,
		cacheDir
	})

	setMinaInstance(network)

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
