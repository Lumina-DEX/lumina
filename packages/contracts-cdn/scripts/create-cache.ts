import fs from "node:fs/promises"
import path from "node:path"

import { unzipSync, zipSync } from "fflate"
import { Cache } from "o1js"

import { execSync } from "node:child_process"
import {
	Faucet,
	FungibleToken,
	FungibleTokenAdmin,
	Pool,
	PoolFactory,
	PoolTokenHolder
} from "@lumina-dex/contracts"

const __dirname = path.dirname(new URL(import.meta.url).pathname)
export const cacheDir = path.resolve(__dirname, "../cache")

await fs.mkdir(cacheDir, { recursive: true })

export const publicDir = path.resolve(__dirname, "../public/cdn-cgi/assets")
export const testDir = path.resolve(__dirname, "../test")

await fs.rm(publicDir, { recursive: true, force: true })

const publicCacheDir = path.resolve(publicDir, "cache")
await fs.mkdir(publicCacheDir, { recursive: true })

const cache = Cache.FileSystem(cacheDir)

async function compileContracts() {
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
	await ct(FungibleTokenAdmin)
	await ct(Faucet)
	console.log("Compilation done")
}

async function writeCache() {
	const cachedContracts = await fs.readdir(cacheDir)

	const filterPkAndHeader = (x: string) => !x.includes("-pk-") && !x.includes(".header")

	console.log("Writing compiled.json...")
	const fileName = cachedContracts.filter(filterPkAndHeader)
	const json = JSON.stringify(fileName)
	await fs.writeFile(path.resolve(publicDir, "compiled.json"), json, "utf8")
	await fs.writeFile(
		path.resolve(testDir, "generated-cache.ts"),
		`export const cache = ${json}.join()`,
		"utf8"
	)

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
}

async function createOptimizedZipBundle() {
	const files = await fs.readdir(publicCacheDir)
	const filesContent = {} as Record<string, Uint8Array>

	for (const file of files) {
		filesContent[file] = await fs.readFile(path.join(publicCacheDir, file))
	}

	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	const zipObj: Record<string, Uint8Array | [Uint8Array, any]> = {}

	console.log("Reading files...")
	for (const file of files) {
		const content = await fs.readFile(path.join(publicCacheDir, file))
		const stats = await fs.stat(path.join(publicCacheDir, file))

		// For files larger than 500KB, use maximum compression
		if (stats.size > 500000) {
			zipObj[file] = [new Uint8Array(content), { level: 9, mem: 12 }]
		} else {
			// For smaller files, use lower compression to save CPU
			zipObj[file] = [new Uint8Array(content), { level: 6 }]
		}
	}

	console.log("Creating zip bundles...")
	// Create single ZIP with all files
	const zipped = zipSync(zipObj)
	await fs.writeFile(path.join(publicDir, "bundle.zip"), zipped)

	const unzipped = unzipSync(zipped)
	console.log("Files in zip:", Object.keys(unzipped))
	const tempDir = path.join(publicDir, "temp_diff")
	await fs.mkdir(tempDir, { recursive: true })

	// Compare files
	let allMatch = true
	try {
		for (const [filename, originalContent] of Object.entries(filesContent)) {
			const unzippedContent = unzipped[filename]
			if (!unzippedContent) {
				console.error(`Missing file in unzipped content: ${filename}`)
				allMatch = false
				continue
			}

			if (originalContent.length !== unzippedContent.length) {
				console.error(`Size mismatch for ${filename}:`)
				console.error(`  Original: ${originalContent.length} bytes`)
				console.error(`  Unzipped: ${unzippedContent.length} bytes`)
				allMatch = false
				continue
			}

			const originalPath = path.join(tempDir, `original_${filename}`)
			const unzippedPath = path.join(tempDir, `unzipped_${filename}`)

			await fs.writeFile(originalPath, originalContent, "utf-8")
			await fs.writeFile(unzippedPath, unzipped[filename], "utf-8")
			execSync(`diff "${originalPath}" "${unzippedPath}"`, { stdio: "inherit" })
		}

		if (allMatch) {
			console.log("All files match perfectly!")
		} else {
			console.log("Found mismatches!")
		}
	} catch (e) {
		console.error(e)
	} finally {
		await fs.rmdir(tempDir, { recursive: true })
	}
	// Create manifest
	const manifest = {
		version: "1.0",
		files: Object.keys(zipObj),
		totalFiles: Object.keys(zipObj).length
	}

	await fs.writeFile(path.join(publicDir, "manifest.json"), JSON.stringify(manifest, null, 2))
}

console.time("start")
// TODO: Compilation needs to run at least 3 times to to generate all the cached files.
await compileContracts()
await compileContracts()
await compileContracts()
await writeCache()
await createOptimizedZipBundle()
console.timeEnd("start")
