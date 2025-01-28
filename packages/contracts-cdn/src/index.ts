import type { Networks } from "@lumina-dex/sdk"
import { networks } from "@lumina-dex/sdk/constants"
import { addRoute, createRouter, findRoute } from "rou3"
import type { Env } from "../worker-configuration"
import { type Token, createList } from "./helper"
import { auth, getDb, headers, notFound, serveAsset, sync, tokenCacheKey } from "./http"

const router = createRouter<{ path: string }>()

addRoute(router, "GET", "/api/cache", { path: "cache" })

addRoute(router, "GET", "/api/:network/tokens", { path: "tokens" })
addRoute(router, "GET", "/api/:network/tokens/count", { path: "tokens/count" })
addRoute(router, "POST", "/api/:network/token", { path: "token.post" })

addRoute(router, "POST", "/api/:network/sync", { path: "sync" })
addRoute(router, "POST", "/api/:network/reset", { path: "reset" })

addRoute(router, "GET", "/scheduled", { path: "scheduled" })

export default {
	async scheduled(event, env, context) {
		await Promise.all(networks.map((network) => sync({ env, network, context })))
		console.log("Synced all networks")
	},
	async fetch(request, env, context): Promise<Response> {
		//TODO: implement rate-limiting and bot protection here.
		const url = new URL(request.url)
		const match = findRoute(router, request.method, url.pathname)

		// Manually trigger the Scheduled event for Auth users
		if (match?.data.path === "scheduled" && auth({ env, request })) {
			await Promise.all(networks.map((network) => sync({ env, network, context })))
			return new Response("Synced all networks", { headers, status: 200 })
		}

		// Reset the database for a given network
		if (match?.data.path === "reset" && match.params?.network && auth({ env, request })) {
			const network = match.params.network as Networks
			if (!networks.includes(network)) return notFound()
			const db = getDb(env)
			await db.reset({ network })
			await sync({ env, network, context })
			return new Response("Database reset and synced", { headers, status: 200 })
		}

		// Sync a network
		if (match?.data.path === "sync" && match.params?.network) {
			const network = match.params.network as Networks
			if (!networks.includes(network)) return notFound()
			const { success } = await env.SYNC_RATE_LIMITER.limit({ key: "sync" })
			if (!success) return new Response("Rate limited", { headers, status: 429 })

			const { readable, writable } = new TransformStream()
			const writer = writable.getWriter()
			const response = new Response(readable, {
				headers: {
					...headers,
					"Content-Type": "text/event-stream",
					"Cache-Control": "no-cache",
					Connection: "keep-alive",
					"Transfer-Encoding": "chunked"
				}
			})

			const encoder = new TextEncoder()
			writer.write(encoder.encode(`Starting sync for ${network}...\n`))

			async function respondWithStream() {
				try {
					await sync({ env, network, context })
					await writer.write(encoder.encode(`Sync completed for ${network}`))
				} catch {
					await writer.write(encoder.encode("Error during sync"))
				} finally {
					await writer.close()
				}
			}

			respondWithStream()
			return response
		}

		// Add a new token to the database and purge the cache
		if (match?.data.path === "token.post" && match.params?.network && auth({ env, request })) {
			const network = match.params.network as Networks
			if (!networks.includes(network)) return notFound()
			const db = getDb(env)
			const body = await request.json()
			// Validate the data
			const token = body as Token
			const exists = await db.tokenExists({
				network,
				address: token.address,
				poolAddress: token.poolAddress
			})
			if (exists) return new Response("Token already exists", { headers, status: 409 })
			await db.insertToken(network, token)

			const cacheKey = tokenCacheKey(match.params.network)
			context.waitUntil(caches.default.delete(cacheKey))
			return new Response("Token Inserted", { headers, status: 201 })
		}

		// Count the amount of tokens for a given network
		if (match?.data.path === "tokens/count" && match.params?.network) {
			const network = match.params.network as Networks
			if (!networks.includes(network)) return notFound()

			const db = getDb(env)
			const count = await db.count({ network })

			return Response.json(count)
		}

		// Return the token list for a given network
		if (match?.data.path === "tokens" && match.params?.network) {
			// Check for the cache
			const network = match.params.network as Networks
			if (!networks.includes(network)) return notFound()

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
			if (!tokens) return notFound()
			const response = Response.json(tokens, { headers })
			// response.headers.append("Cache-Control", "s-maxage=60") // We don't want the user to cache the response in his browser.
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
