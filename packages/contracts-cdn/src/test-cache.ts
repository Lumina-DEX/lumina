import type { Env } from "../worker-configuration"

export default {
	async fetch(request, env, context): Promise<Response> {
		const url = new URL(request.url)
		if (request.method === "POST") {
			const cacheKey = new URL(`http://cache.key/custom${url.pathname}`)
			context.waitUntil(caches.default.delete(cacheKey))
			console.log("Cache Deleted")
			return new Response("Busted", { status: 201 })
		}

		const cacheKey = new URL(`http://cache.key/custom${url.pathname}`)
		const cache = caches.default
		const cacheResponse = await cache.match(cacheKey)
		if (cacheResponse?.ok) {
			console.log("Returning From Cache")
			return cacheResponse
		}
		const newResponse = new Response("Something")
		newResponse.headers.append("Cache-Control", "s-maxage=3600") // 1 hour
		context.waitUntil(cache.put(cacheKey, newResponse.clone()))
		console.log("Returning Fresh")
		return newResponse
	}
} satisfies ExportedHandler<Env>
export { TokenList } from "./do"
