import type { Networks } from "@lumina-dex/sdk"
import { networks } from "@lumina-dex/sdk/constants"
import { addRoute, createRouter, findRoute } from "rou3"
import type { Env } from "../worker-configuration"
import { type Token, createList } from "./helper"
import { sync } from "./workflow"

const router = createRouter<{ path: string }>()

addRoute(router, "GET", "/api/cache", { path: "cache" })
addRoute(router, "GET", "/api/:network/tokens", { path: "tokens" })
addRoute(router, "POST", "/api/:network/token", { path: "token.post" })
addRoute(router, "GET", "/api/:network/tokens/count", { path: "tokens/count" })
addRoute(router, "GET", "/scheduled", { path: "scheduled" })

interface ServeAsset {
	assetUrl: URL
	env: Env
	request: Request
	context: ExecutionContext
}

const getDb = (env: Env) => {
	const dbDO = env.TOKENLIST.idFromName(env.DO_TOKENLIST_NAME)
	return env.TOKENLIST.get(dbDO)
}

/**
 * Serve an asset if it exists or return a 404. Use cache if possible.
 */
const serveAsset = async ({ assetUrl, env, request, context }: ServeAsset) => {
	//Cache Key must be a Request to avoid leaking headers to other users.
	const cacheKey = new Request(assetUrl.toString(), request)
	const cache = caches.default
	const cacheResponse = await cache.match(cacheKey)
	if (cacheResponse?.ok) return cacheResponse

	const assetResponse = await env.ASSETS.fetch(assetUrl)
	const response = new Response(assetResponse.body, assetResponse)
	//Here we can control the cache headers precisely.
	if (response.ok) {
		response.headers.append("Cache-Control", "s-maxage=10")
		context.waitUntil(cache.put(cacheKey, response.clone()))
	}
	return response
}

const syncAllNetworks = async ({ env, context }: { env: Env; context: ExecutionContext }) => {
	//TODO: Add retry policy
	await Promise.all(networks.map((network) => sync({ env, network })))

	for (const network of networks) {
		const cacheKey = tokenCacheKey(network)
		context.waitUntil(caches.default.delete(cacheKey))
	}
	console.log("Synced all networks")
}

const tokenCacheKey = (network: string) => new URL(`http://token.key/${network}`)

export default {
	async scheduled(event, env, context) {
		await syncAllNetworks({ env, context })
	},
	async fetch(request, env, context): Promise<Response> {
		//TODO: implement rate-limiting and bot protection here.

		const url = new URL(request.url)
		const match = findRoute(router, request.method, url.pathname)

		// Manually trigger the Scheduled event for Auth users
		if (
			match?.data.path === "scheduled" &&
			request.headers.get("Authorization") === `Bearer ${env.LUMINA_TOKEN_ENDPOINT_AUTH_TOKEN}`
		) {
			await syncAllNetworks({ env, context })
			return new Response("Synced all networks", { status: 200 })
		}

		// Count the amount of tokens for a given network
		if (match?.data.path === "tokens/count" && match.params?.network) {
			const network = match.params.network as Networks
			if (!networks.includes(network)) {
				return new Response("Not Found", { status: 404 })
			}

			const db = getDb(env)
			const count = await db.count({ network })

			return Response.json(count)
		}

		// Add a new token to the database and purge the cache
		if (match?.data.path === "token.post" && match.params?.network) {
			const network = match.params.network as Networks
			if (!networks.includes(network)) {
				return new Response("Not Found", { status: 404 })
			}

			const db = getDb(env)
			const body = await request.json()
			// Validate the data
			const token = body as Token
			const exists = await db.tokenExists({
				network,
				address: token.address,
				poolAddress: token.poolAddress
			})
			if (exists) return new Response("Token already exists", { status: 409 })
			await db.insertToken(network, token)

			const cacheKey = tokenCacheKey(match.params.network)
			context.waitUntil(caches.default.delete(cacheKey))
			return new Response("Token Inserted", { status: 201 })
		}

		// Return the token list for a given network
		if (match?.data.path === "tokens" && match.params?.network) {
			// Check for the cache
			const network = match.params.network as Networks
			if (!networks.includes(network)) {
				return new Response("Not Found", { status: 404 })
			}

			const cacheKey = tokenCacheKey(match.params.network)
			const cache = caches.default
			const cacheResponse = await cache.match(cacheKey)
			if (cacheResponse?.ok) {
				return cacheResponse
			}

			// Fetch the Data from the database.
			const db = getDb(env)
			const data = await db.findAllTokens({ network })

			const tokens = createList(network)(data)
			if (!tokens) return new Response("Not Found", { status: 404 })
			const response = Response.json(tokens)
			response.headers.append("Cache-Control", "s-maxage=3600") // 1 hour
			context.waitUntil(cache.put(cacheKey, response.clone()))
			data[Symbol.dispose]() //TODO: Use using keyword
			return response
		}

		// Return the json data with the cached contracts
		if (match?.data.path === "cache") {
			const assetUrl = new URL(`${url.origin}/cdn-cgi/assets/compiled.json`)
			return serveAsset({ assetUrl, env, request, context })
		}

		// Serve the assets
		const assetUrl = new URL(`${url.origin}/cdn-cgi/assets${url.pathname}`)
		return serveAsset({ assetUrl, env, request, context })
	}
} satisfies ExportedHandler<Env>

export { TokenList } from "./do"
