import MagicString from "magic-string"
import type { Plugin, ResolveIdResult, TransformResult } from "rollup"

interface OMTOptions {
	/** Scheme used when importing workers as URL */
	urlLoaderScheme?: string
}

const defaultOpts: Required<OMTOptions> = {
	urlLoaderScheme: "omt"
}

// A regexp to find static `new Worker` invocations.
// Matches `new Worker(...file part...`
// File part matches one of:
// - '...'
// - "..."
// - `import.meta.url`
// - new URL('...', import.meta.url)
// - new URL("...", import.meta.url)
const workerRegexpForTransform =
	/(new\s+SharedWorker\()\s*(('.*?'|".*?")|import\.meta\.url|new\s+URL\(('.*?'|".*?"),\s*import\.meta\.url\))/gs

let longWarningAlreadyShown = false

export default function WebWorker(userOptions: OMTOptions = {}): Plugin {
	const options: Required<OMTOptions> = { ...defaultOpts, ...userOptions }

	const urlLoaderPrefix = `${options.urlLoaderScheme}:`

	let workerFiles: string[] = []

	return {
		name: "web-worker",

		async buildStart(): Promise<void> {
			workerFiles = []
		},

		async resolveId(id: string, importer?: string): Promise<ResolveIdResult> {
			if (!id.startsWith(urlLoaderPrefix)) return

			const path = id.slice(urlLoaderPrefix.length)
			const resolved = await this.resolve(path, importer)
			if (!resolved) {
				throw Error(`Cannot find module '${path}' from '${importer}'`)
			}
			const newId = resolved.id

			return urlLoaderPrefix + newId
		},

		load(id: string): string | null {
			if (!id.startsWith(urlLoaderPrefix)) return null

			const realId = id.slice(urlLoaderPrefix.length)
			const chunkRef = this.emitFile({ id: realId, type: "chunk" })
			return `export default import.meta.ROLLUP_FILE_URL_${chunkRef};`
		},

		async transform(code: string, id: string): Promise<TransformResult> {
			// const mod = this.getModuleInfo(id)
			const ms = new MagicString(code)

			const replacementPromises: Promise<void>[] = []

			for (const match of code.matchAll(workerRegexpForTransform)) {
				let [fullMatch, partBeforeArgs, workerSource, directWorkerFile, workerFile] = match

				const workerParametersEndIndex = match.index + fullMatch.length
				const matchIndex = match.index
				const workerParametersStartIndex = matchIndex + partBeforeArgs.length

				let workerIdPromise: Promise<string>
				if (workerSource === "import.meta.url") {
					// Turn the current file into a chunk
					workerIdPromise = Promise.resolve(id)
				} else {
					// Otherwise it's a string literal either directly or in the `new URL(...)`.
					if (directWorkerFile) {
						const fullMatchWithOpts = `${fullMatch}, …)`
						const fullReplacement = `new Worker(new URL(${directWorkerFile}, import.meta.url), …)`

						if (!longWarningAlreadyShown) {
							this.warn(
								`rollup-plugin-off-main-thread:
\`${fullMatchWithOpts}\` suggests that the Worker should be relative to the document, not the script.
In the bundler, we don't know what the final document's URL will be, and instead assume it's a URL relative to the current module.
This might lead to incorrect behaviour during runtime.
If you did mean to use a URL relative to the current module, please change your code to the following form:
\`${fullReplacement}\`
This will become a hard error in the future.`,
								matchIndex
							)
							longWarningAlreadyShown = true
						} else {
							this.warn(
								`rollup-plugin-off-main-thread: Treating \`${fullMatchWithOpts}\` as \`${fullReplacement}\``,
								matchIndex
							)
						}
						workerFile = directWorkerFile
					}

					// Cut off surrounding quotes.
					workerFile = workerFile.slice(1, -1)

					if (!/^\.{1,2}\//.test(workerFile)) {
						let isError = false
						if (directWorkerFile) {
							// If direct worker file, it must be in `./something` form.
							isError = true
						} else {
							// If `new URL(...)` it can be in `new URL('something', import.meta.url)` form too,
							// so just check it's not absolute.
							if (/^(\/|https?:)/.test(workerFile)) {
								isError = true
							} else {
								// If it does turn out to be `new URL('something', import.meta.url)` form,
								// prepend `./` so that it becomes valid module specifier.
								workerFile = `./${workerFile}`
							}
						}
						if (isError) {
							this.warn(
								`Paths passed to the Worker constructor must be relative to the current file, i.e. start with ./ or ../ (just like dynamic import!). Ignoring "${workerFile}".`,
								matchIndex
							)
							continue
						}
					}

					workerIdPromise = this.resolve(workerFile, id).then((res) => {
						if (!res) {
							throw this.error(`Cannot find module '${workerFile}' from '${id}'`)
						}
						return res?.id
					})
				}

				replacementPromises.push(
					(async () => {
						const resolvedWorkerFile = await workerIdPromise
						workerFiles.push(resolvedWorkerFile)
						const chunkRefId = this.emitFile({
							id: resolvedWorkerFile,
							type: "chunk"
						})

						ms.overwrite(
							workerParametersStartIndex,
							workerParametersEndIndex,
							`new URL(import.meta.ROLLUP_FILE_URL_${chunkRefId}, import.meta.url)`
						)
					})()
				)
			}

			// No matches found.
			if (!replacementPromises.length) {
				return
			}

			// Wait for all the scheduled replacements to finish.
			await Promise.all(replacementPromises)

			return {
				code: ms.toString(),
				map: ms.generateMap({ hires: true })
			}
		},

		resolveFileUrl(chunk): string {
			return JSON.stringify(chunk.relativePath)
		},

		outputOptions({ format }): void {
			if (!(format === "esm" || format === "es")) {
				this.warn(`\`output.format\` must be "esm", got "${format}"`)
			}
		}
	}
}
