import { execSync } from "node:child_process"
import fs from "node:fs/promises"
import path from "node:path"
import { unzipSync, zipSync } from "fflate"

import contracts from "../../contracts/package.json" with { type: "json" }

const { version } = contracts

const __dirname = path.dirname(new URL(import.meta.url).pathname)

// NETWORK_TYPE=mainnet|testnet (default: testnet)
const networkType = (process.env.NETWORK_TYPE === "mainnet" ? "mainnet" : "testnet") as "mainnet" | "testnet"

// Optional CACHE_DIR override, defaults to cache/<networkType>
export const cacheDir = process.env.CACHE_DIR
	? path.resolve(process.cwd(), process.env.CACHE_DIR)
	: path.resolve(__dirname, `../cache/${networkType}`)

// Output directory per network
export const publicDir = path.resolve(__dirname, `../public/cdn-cgi/assets/${networkType}/v${version}`)
export const testDir = path.resolve(__dirname, "../test")

console.log(`Creating cache for ${networkType} - version v${version}`)
console.log(`cacheDir: ${cacheDir}`)
console.log(`publicDir: ${publicDir}`)

// Remove previous output if it exists
await fs.rm(publicDir, { recursive: true, force: true })

const publicCacheDir = path.resolve(publicDir, "cache")
await fs.mkdir(publicCacheDir, { recursive: true })

async function writeCache() {
	const cachedContracts = await fs.readdir(cacheDir)

	const filterPkAndHeader = (x: string) => !x.includes("-pk-") && !x.includes(".header")

	console.log("Writing compiled.json...")
	const fileName = cachedContracts.filter(filterPkAndHeader)
	const json = JSON.stringify(fileName)

	await fs.writeFile(path.resolve(publicDir, "compiled.json"), json, "utf8")

	// Generate a network-specific cache file for tests/dev tooling
	await fs.writeFile(
		path.resolve(testDir, `generated-cache.${networkType}.ts`),
		`export const cache = ${json}.join();
export const version = "${version}";
export const networkType = "${networkType}";`,
		"utf8"
	)

	console.log("Copying cache files to public directory...")
	await fs.cp(cacheDir, publicCacheDir, {
		recursive: true,
		filter: (source) => filterPkAndHeader(path.basename(source))
	})

	const publicCacheContent = await fs.readdir(publicCacheDir)

	console.log("Renaming files for better browser compression...")
	for (const file of publicCacheContent) {
		const fullPath = path.join(publicCacheDir, file)
		const fileExtension = path.extname(file)
		const fileName = path.basename(file, fileExtension)

		// Use .txt extension to enable better browser compression
		const newFileName = `${fileName}.txt`
		await fs.rename(fullPath, path.join(publicCacheDir, newFileName))
	}

	return json
}

async function createOptimizedZipBundle(c: string) {
	const files = await fs.readdir(publicCacheDir)
	const filesContent: Record<string, Uint8Array> = {}

	for (const file of files) {
		filesContent[file] = await fs.readFile(path.join(publicCacheDir, file))
	}

	// ZIP entries with adaptive compression
	const zipObj: Record<string, Uint8Array | [Uint8Array, any]> = {}

	console.log("Reading files for ZIP bundle...")
	for (const file of files) {
		const content = await fs.readFile(path.join(publicCacheDir, file))
		const stats = await fs.stat(path.join(publicCacheDir, file))

		// Use stronger compression for large files
		if (stats.size > 500_000) {
			zipObj[file] = [new Uint8Array(content), { level: 9, mem: 12 }]
		} else {
			// Use lighter compression for small files to save CPU
			zipObj[file] = [new Uint8Array(content), { level: 6 }]
		}
	}

	console.log("Creating ZIP bundle...")
	const zipped = zipSync(zipObj)
	await fs.writeFile(path.join(publicDir, "bundle.zip"), zipped)

	// Verify ZIP integrity by comparing with original files
	const unzipped = unzipSync(zipped)
	console.log("Files in ZIP:", Object.keys(unzipped))

	const tempDir = path.join(publicDir, "temp_diff")
	await fs.mkdir(tempDir, { recursive: true })

	let allMatch = true
	try {
		for (const [filename, originalContent] of Object.entries(filesContent)) {
			const unzippedContent = unzipped[filename]
			if (!unzippedContent) {
				console.error(`Missing file in ZIP: ${filename}`)
				allMatch = false
				continue
			}

			if (originalContent.length !== unzippedContent.length) {
				console.error(`Size mismatch for ${filename}`)
				allMatch = false
				continue
			}

			const originalPath = path.join(tempDir, `original_${filename}`)
			const unzippedPath = path.join(tempDir, `unzipped_${filename}`)

			await fs.writeFile(originalPath, originalContent, "utf-8")
			await fs.writeFile(unzippedPath, unzippedContent, "utf-8")
			execSync(`diff "${originalPath}" "${unzippedPath}"`, { stdio: "inherit" })
		}

		console.log(allMatch ? "ZIP verification successful" : "ZIP verification failed")
	} catch (e) {
		console.error(e)
	} finally {
		await fs.rm(tempDir, { recursive: true })
	}

	// Manifest file for this network + version
	const manifest = {
		version,
		networkType,
		cache: JSON.parse(c),
		files: Object.keys(zipObj),
		totalFiles: Object.keys(zipObj).length
	}

	await fs.writeFile(path.join(publicDir, "manifest.json"), JSON.stringify(manifest, null, 2))
}

const c = await writeCache()
await createOptimizedZipBundle(c)
