import { addRoute, createRouter, findRoute } from "rou3"
import { minaTestnet } from "./tokenDb"

const router = createRouter<{ path: string }>()

addRoute(router, "GET", "/api/cache", { path: "cache" })
addRoute(router, "GET", "/api/:network/tokens", { path: "tokens" })

interface ServeAsset {
	assetUrl: URL
	env: Env
	request: Request
	context: ExecutionContext
}

const serveAsset = async ({ assetUrl, env, request, context }: ServeAsset) => {
	//Cache Key must be a Request to avoid leaking headers to other users.
	const cacheKey = new Request(assetUrl.toString(), request)
	const cache = caches.default
	const cacheResponse = await cache.match(cacheKey)
	if (cacheResponse) return cacheResponse

	const assetResponse = await env.ASSETS.fetch(assetUrl)
	const response = new Response(assetResponse.body, assetResponse)
	//Here we can control the cache headers precisely.
	response.headers.append("Cache-Control", "s-maxage=10")
	if (response.ok) {
		context.waitUntil(cache.put(cacheKey, response.clone()))
	}
	return response
}

export default {
	async fetch(request, env, context): Promise<Response> {
		//TODO: implement rate-limiting and bot protection here.

		const url = new URL(request.url)
		const match = findRoute(router, "GET", url.pathname)
		if (match?.data.path === "cache") {
			const assetUrl = new URL(`${url.origin}/cdn-cgi/assets/compiled.json`)
			return serveAsset({ assetUrl, env, request, context })
		}
		if (match?.data.path === "tokens" && match.params?.network) {
			// Check for the cache
			const cacheKey = new URL(`http://token.key/${match.params.network}${url.pathname}`)
			const cache = caches.default
			const cacheResponse = await cache.match(cacheKey)
			if (cacheResponse) return cacheResponse
			// Find the tokens List
			const tokens = { "mina:testnet": minaTestnet() }[match.params?.network] // TODO: Use a database
			if (!tokens) return new Response("Not Found", { status: 404 })
			const response = Response.json(tokens)
			response.headers.append("Cache-Control", "s-maxage=3600")
			context.waitUntil(cache.put(cacheKey, response.clone()))
			return response
		}

		const assetUrl = new URL(`${url.origin}/cdn-cgi/assets${url.pathname}`)
		return serveAsset({ assetUrl, env, request, context })
	}
} satisfies ExportedHandler<Env>
