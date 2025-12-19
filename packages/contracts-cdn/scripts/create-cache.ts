import { execSync } from "node:child_process"
import fs from "node:fs/promises"
import path from "node:path"
import { unzipSync, zipSync } from "fflate"

import contracts from "../../contracts/package.json" with { type: "json" }

const { version } = contracts
console.log(`Creating cache for version ${version}`)

const __dirname = path.dirname(new URL(import.meta.url).pathname)

/**
 * CLI:
 *   node ... create-cache.ts [network]
 *
 * Examples:
 *   mina:devnet   (default, legacy output)
 *   mina:mainnet  (output under public/.../mina_mainnet/v{version})
 */
const network = (process.argv[2] ?? "mina:devnet").toLowerCase()
const isMainnet = network.includes("mainnet")
const networkStandardized = network.replace(":", "_")

/**
 * Cache input directory:
 * - legacy devnet/testnet -> ../cache
 * - mainnet              -> ../cache/mina_mainnet
 */
export const cacheDir = isMainnet
	? path.resolve(__dirname, `../cache/${networkStandardized}`)
	: path.resolve(__dirname, "../cache")

/**
 * Public output directory:
 * - legacy devnet/testnet -> ../public/cdn-cgi/assets/v{version}
 * - mainnet              -> ../public/cdn-cgi/assets/mina_mainnet/v{version}
 */
export const publicDir = isMainnet
	? path.resolve(__dirname, `../public/cdn-cgi/assets/${networkStandardized}/v${version}`)
	: path.resolve(__dirname, `../public/cdn-cgi/assets/v${version}`)

export const testDir = path.resolve(__dirname, "../test")

console.log("Cache bundle settings:", { network, networkStandardized, cacheDir, publicDir })

await fs.rm(publicDir, { recursive: true, force: true })

const publicCacheDir = path.resolve(publicDir, "cache")
await fs.mkdir(publicCacheDir, { recursive: true })

async function writeCache() {
	const cachedContracts = await fs.readdir(cacheDir)

	// Keep this filter: proving keys + headers are too large for client delivery.
	const filterPkAndHeader = (x: string) => !x.includes("-pk-") && !x.includes(".header")

	console.log("Writing compiled.json...")
	const fileName = cachedContracts.filter(filterPkAndHeader)
	const json = JSON.stringify(fileName)

	await fs.writeFile(path.resolve(publicDir, "compiled.json"), json, "utf8")

	// Keep the same filename to avoid breaking tests/tooling.
	await fs.writeFile(
		path.resolve(testDir, "generated-cache.ts"),
		`export const cache = ${json}.join();
export const version = "${version}";`,
		"utf8"
	)

	console.log("Copying cache to public...")
	await fs.cp(cacheDir, publicCacheDir, {
		recursive: true,
		filter: (source) => filterPkAndHeader(source)
	})

	const publicCacheContent = await fs.readdir(publicCacheDir)

	console.log("Renaming files...")
	for (const file of publicCacheContent) {
		const fullPath = path.join(publicCacheDir, file)
		const fileExtension = path.extname(file)
		const fileNameOnly = path.basename(file, fileExtension)

		// Use .txt extension to enable better browser compression.
		const newFileName = `${fileNameOnly}.txt`
		await fs.rename(fullPath, path.join(publicCacheDir, newFileName))
	}

	return json
}

async function createOptimizedZipBundle(c: string) {
	const files = await fs.readdir(publicCacheDir)
	const filesContent = {} as Record<string, Uint8Array>

	for (const file of files) {
		filesContent[file] = await fs.readFile(path.join(publicCacheDir, file))
	}

	// biome-ignore lint/suspicious/noExplicitAny: zip level config is not typed
	const zipObj: Record<string, Uint8Array | [Uint8Array, any]> = {}

	console.log("Reading files...")
	for (const file of files) {
		const content = await fs.readFile(path.join(publicCacheDir, file))
		const stats = await fs.stat(path.join(publicCacheDir, file))

		// For files larger than 500KB, use maximum compression.
		if (stats.size > 500000) {
			zipObj[file] = [new Uint8Array(content), { level: 9, mem: 12 }]
		} else {
			// For smaller files, use lower compression to save CPU.
			zipObj[file] = [new Uint8Array(content), { level: 6 }]
		}
	}

	console.log("Creating zip bundle...")
	const zipped = zipSync(zipObj)
	await fs.writeFile(path.join(publicDir, "bundle.zip"), zipped)

	const unzipped = unzipSync(zipped)
	console.log("Files in zip:", Object.keys(unzipped))

	const tempDir = path.join(publicDir, "temp_diff")
	await fs.mkdir(tempDir, { recursive: true })

	// Compare files to verify zip integrity.
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
			await fs.writeFile(unzippedPath, unzippedContent, "utf-8")
			execSync(`diff "${originalPath}" "${unzippedPath}"`, { stdio: "inherit" })
		}

		console.log(allMatch ? "All files match perfectly!" : "Found mismatches!")
	} catch (e) {
		console.error(e)
	} finally {
		await fs.rm(tempDir, { recursive: true })
	}

	// Create manifest.
	const manifest = {
		version,
		network,
		cache: JSON.parse(c),
		files: Object.keys(zipObj),
		totalFiles: Object.keys(zipObj).length
	}

	await fs.writeFile(path.join(publicDir, "manifest.json"), JSON.stringify(manifest, null, 2))
}

const c = await writeCache()
await createOptimizedZipBundle(c)
