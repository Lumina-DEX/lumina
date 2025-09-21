import { type ConsolaInstance, createConsola } from "consola"

const safeProcess = globalThis.process || { env: {} }
export const getDebugConfig = () => {
	return {
		disableCache:
			globalThis.localStorage?.getItem("disableCache") === "true" ||
			safeProcess?.env?.SDK_DEBUG_CONFIG_disableCache === "true",
		debugLogs:
			globalThis.localStorage?.getItem("debugLevel") === "true" || safeProcess?.env?.NODE_ENV === "production" ? 0 : 5
	}
}

export const logger = createConsola({
	level: getDebugConfig().debugLogs,
	fancy: true
}).withTag("SDK")

export const prefixedLogger = (prefix: string) =>
	new Proxy(logger, {
		get(target, prop) {
			const originalMethod = target[prop as keyof typeof target]

			if (typeof originalMethod === "function") {
				return (...args: unknown[]) => {
					const newArgs = [prefix, ...args]
					return Reflect.apply(originalMethod, target, newArgs)
				}
			}

			return originalMethod
		}
	})

export const createMeasure = (l: ConsolaInstance) => (label: string) => {
	const start = performance.now()
	let done = false
	return () => {
		if (done) return
		const end = performance.now()
		l.warn(`${label}: ${end - start} ms`)
		done = true
	}
}

/**
 * Helper function to measure and log the time taken to execute an action.
 */
export const createLogger = (prefix: string) => {
	const logger = prefixedLogger(prefix)
	const measure = createMeasure(logger)

	const act = async <T>(label: string, body: ({ stop }: { stop: () => void }) => Promise<T>) => {
		const stop = measure(label)
		logger.start(label)
		try {
			const result = await body({ stop })
			logger.success(label)
			stop()
			return result
		} catch (e) {
			logger.error(`${label} Error:`, e)
			stop()
			throw e
		}
	}
	return { act, logger, measure }
}
