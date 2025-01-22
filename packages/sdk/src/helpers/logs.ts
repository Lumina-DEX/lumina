import { type ConsolaInstance, createConsola } from "consola"

export const logger = createConsola({
	level: process.env.NODE_ENV === "production" ? 0 : 5,
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
