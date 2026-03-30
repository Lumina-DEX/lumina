import fs from "node:fs/promises"
import path from "node:path"
import { contractsVersion as defaultVersion, networks } from "@lumina-dex/sdk/constants"
import { unzipSync } from "fflate"
import { cdnContracts } from "./contracts.ts"

const __dirname = path.dirname(new URL(import.meta.url).pathname)

const network = (process.argv[2] ?? "mina:devnet") as (typeof networks)[number]
const isValidNetwork = networks.includes(network)
if (!isValidNetwork) throw new Error(`Invalid network argument. Expected one of: ${networks.join(", ")}`)

const version = process.argv[3]?.trim() || process.env.CONTRACTS_VERSION_OVERRIDE?.trim() || defaultVersion
const bundlePath = path.resolve(__dirname, `../tmp/contract-cache/${network}/v${version}/bundle.zip`)

const bundle = await fs.readFile(bundlePath)
const entries = Object.keys(unzipSync(new Uint8Array(bundle)))

console.log(`Validating bundle ${bundlePath}`)
console.log("Bundle entries:", entries)

const missingContracts = cdnContracts.filter(({ slug }) => !entries.some((entry) => entry.toLowerCase().includes(slug)))

if (missingContracts.length > 0) {
	const details = missingContracts.map(({ contract, slug }) => `- ${contract.name} (${slug})`).join("\n")
	console.error(`Missing contracts in bundle.zip for ${network} v${version}:\n${details}`)
	process.exit(1)
}

console.log(`Bundle validation successful for ${network} v${version}`)
