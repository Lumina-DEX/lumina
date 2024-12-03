export default {
	async fetch(request, env, context): Promise<Response> {
		//We can implement rate-limiting and bot protection here.
		const url = new URL(request.url)
		const assetUrl = new URL(`${url.origin}/cdn-cgi/assets${url.pathname}`)
		//Cache Key must be a Request to avoid leaking headers to other users.
		const cacheKey = new Request(assetUrl.toString(), request)
		const cache = caches.default
		const cacheResponse = await cache.match(cacheKey)
		if (cacheResponse) return cacheResponse
		const assetResponse = await env.ASSETS.fetch(assetUrl)
		const response = new Response(assetResponse.body, assetResponse)
		//Here we can control the cache headers precisely.
		response.headers.append("Cache-Control", "s-maxage=10")
		context.waitUntil(cache.put(cacheKey, response.clone()))
		return response
	}
} satisfies ExportedHandler<Env>
