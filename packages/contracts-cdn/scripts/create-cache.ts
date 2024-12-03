import fs from "node:fs/promises"
import path from "node:path"

import { Cache } from "o1js"

import {
	Faucet,
	FungibleToken,
	FungibleTokenAdmin,
	Pool,
	PoolFactory,
	PoolTokenHolder
} from "@lumina-dex/contracts"

const __dirname = path.dirname(new URL(import.meta.url).pathname)
const cacheDir = path.resolve(__dirname, "../cache")
const publicDir = path.resolve(__dirname, "../public/cdn-cgi/assets")
const publicCacheDir = path.resolve(publicDir, "cache")

const cache = Cache.FileSystem(cacheDir)
console.log("Starting contract compilation :")
console.time("start")

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

// compile 3 time to get all files
for (let index = 0; index < 6; index++) {
	console.log(`[LOOP]: Compilation ${index}`)
	await ct(PoolFactory)
	await ct(Pool)
	await ct(FungibleToken)
	await ct(FungibleTokenAdmin)
	await ct(PoolTokenHolder)
	await ct(Faucet)
}
console.log("Compilation done")

const cachedContracts = await fs.readdir(cacheDir)

// we will filter pk directly on the frontend
const filterPkAndHeader = (name: string) => {
	return name.includes("-pk-") || name.includes(".header")
}

await fs.mkdir(publicDir, { recursive: true })

console.log("Writing compiled.json...")
const fileName = cachedContracts.filter(filterPkAndHeader)
const json = JSON.stringify(fileName)
await fs.writeFile(path.resolve(publicDir, "compiled.json"), json, "utf8")

console.log("Copying cache to public...")
await fs.cp(cacheDir, publicCacheDir, {
	recursive: true,
	filter: (source) => filterPkAndHeader(source)
})

const publicCacheContent = await fs.readdir(publicCacheDir)

console.log("Renaming files...")
// Loop through array and rename all files
for (const file of publicCacheContent) {
	const fullPath = path.join(publicCacheDir, file)
	const fileExtension = path.extname(file)
	const fileName = path.basename(file, fileExtension)

	// we use textfile to get browser compression
	const newFileName = `${fileName}.txt`
	await fs.rename(fullPath, path.join(publicCacheDir, newFileName))
}
console.timeEnd("start")
