import { Container } from "@cloudflare/containers"
import type { Networks } from "@lumina-dex/sdk"
import { networks } from "@lumina-dex/sdk/constants"
import { addRoute, createRouter, findRoute } from "rou3"
import * as v from "valibot"
import { PoolSchema, TokenSchema } from "./helper"
import { auth, getDb, headers, notFound, poolCacheKey, serveAsset, sync, tokenCacheKey } from "./http"
import { cleanPoolTable } from "./supabase"

const router = createRouter<{ path: string }>()

addRoute(router, "GET", "/api/manifest/:version", { path: "manifest" })

addRoute(router, "GET", "/api/:network/:entities", { path: "entities" })
addRoute(router, "GET", "/api/:network/:entities/count", { path: "entities/count" })
addRoute(router, "POST", "/api/:network/:entity", { path: "entity.post" })

addRoute(router, "POST", "/api/:network/sync", { path: "sync" })
addRoute(router, "POST", "/api/:network/reset", { path: "reset" })

addRoute(router, "GET", "/scheduled", { path: "scheduled" })
addRoute(router, "POST", "/workflows/sync-pool", { path: "sync-pool" })

export class FetchToken extends Container<Env> {
	defaultPort = 3000
	sleepAfter = "5m"
}

// TODO: Update this when we launch a new network.
const liveNetworks = networks.filter((n) => !n.includes("zeko:mainnet"))

export default {
	async scheduled(event, env, context) {
		console.log("Scheduled event triggered", event)
		// Make sure the type here matches the triggers in wrangler.jsonc
		switch (event.cron as "*/30 * * * *" | "0 0 * * *") {
			case "*/30 * * * *":
				await Promise.all(liveNetworks.map((network) => sync({ env, network, context })))
				console.log("Synced all networks")
				break
			case "0 0 * * *":
				await cleanPoolTable({ env })
				console.log("Cleaned pending pools")
				break
		}
	},
	async fetch(request, env, context): Promise<Response> {
		// TODO: implement rate-limiting and bot protection here.
		const url = new URL(request.url)
		const match = findRoute(router, request.method, url.pathname)
		// Manually trigger the SyncPool workflow for Auth users
		if (match?.data.path === "sync-pool" && auth({ env, request })) {
			const body = await request.json()
			const params = v.parse(v.object({ network: v.string(), poolAddress: v.string() }), body)
			const instance = await env.SYNC_POOL.create({ params })
			return Response.json({ id: instance.id, details: await instance.status() }, { headers, status: 201 })
		}

		// Manually trigger the Scheduled event for Auth users
		if (match?.data.path === "scheduled" && auth({ env, request })) {
			const t = url.searchParams.get("type")
			if (t === "clean") {
				await cleanPoolTable({ env })
				return new Response("Cleaned and confirmed pools", { headers, status: 200 })
			}
			await Promise.all(liveNetworks.map((network) => sync({ env, network, context })))
			return new Response("Synced all networks", { headers, status: 200 })
		}

		// Reset the database for a given network
		if (match?.data.path === "reset" && match.params?.network && auth({ env, request })) {
			const network = match.params.network as Networks
			if (!networks.includes(network)) return notFound()
			const db = getDb(env)
			await db.reset({ network })
			const result = await sync({ env, network, context })
			return Response.json(result, { headers, status: 200 })
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
					const result = await sync({ env, network, context })
					await writer.write(encoder.encode(`${JSON.stringify({ result })}\n`))
					await writer.write(encoder.encode(`Sync completed for ${network}`))
				} catch (e) {
					console.error("Error during sync", e)
					await writer.write(encoder.encode("Error during sync"))
				} finally {
					await writer.close()
				}
			}

			respondWithStream()
			return response
		}

		// Add a new token to the database and purge the cache
		if (
			match?.data.path === "entity.post" &&
			["token", "pool"].includes(match.params?.entity ?? "") &&
			match.params?.network &&
			auth({ env, request })
		) {
			const isToken = match.params.entity === "token"
			const network = match.params.network as Networks
			if (!networks.includes(network)) return notFound()
			const db = getDb(env)
			const body = await request.json()
			if (isToken) {
				const token = v.parse(TokenSchema, body)
				const result = await db.insertTokenIfExists({
					network,
					address: token.address,
					token
				})
				if (result === false) return new Response("Token already exists", { headers, status: 409 })
				const cacheKey = tokenCacheKey(match.params.network)
				context.waitUntil(caches.default.delete(cacheKey))
				return new Response("Token Inserted", { headers, status: 201 })
			}
			const pool = v.parse(PoolSchema, body)
			const result = await db.insertPoolIfExists({
				network,
				address: pool.address,
				pool
			})
			if (result === false) return new Response("Pool already exists", { headers, status: 409 })
			const cacheKey = poolCacheKey(match.params.network)
			context.waitUntil(caches.default.delete(cacheKey))
			return new Response("Pool Inserted", { headers, status: 201 })
		}

		// Count the amount of tokens for a given network
		if (
			match?.data.path === "entities/count" &&
			["tokens", "pools"].includes(match.params?.entities ?? "") &&
			match.params?.network
		) {
			const network = match.params.network as Networks
			if (!networks.includes(network)) return notFound()

			const db = getDb(env)
			const count =
				match.params.entities === "tokens" ? await db.countTokens({ network }) : await db.countPools({ network })

			return Response.json(count)
		}

		// Return the list of entities for a given network
		if (
			match?.data.path === "entities" &&
			["tokens", "pools"].includes(match.params?.entities ?? "") &&
			match.params?.network
		) {
			const isToken = match.params.entities === "tokens"
			// Check for the cache
			const network = match.params.network as Networks
			if (!networks.includes(network)) return notFound()

			const cacheKey = isToken ? tokenCacheKey(match.params.network) : poolCacheKey(match.params.network)
			const cache = caches.default
			const cacheResponse = await cache.match(cacheKey)
			if (cacheResponse?.ok) {
				return cacheResponse
			}

			const db = getDb(env)
			const data = isToken ? await db.findAllTokens({ network }) : await db.findAllPools({ network })
			if (!data) return notFound()
			const response = Response.json(data, { headers })
			context.waitUntil(cache.put(cacheKey, response.clone()))
			data[Symbol.dispose]() // TODO: Use using keyword
			return response
		}

		// Return the json data with the cached contracts
		if (match?.data.path === "manifest" && match.params?.version) {
			const assetUrl = new URL(`${url.origin}/cdn-cgi/assets/${match.params.version}/manifest.json`)
			return serveAsset({ assetUrl, env, request, context })
		}

		// Serve the assets
		const assetUrl = new URL(`${url.origin}/cdn-cgi/assets${url.pathname}`)
		return serveAsset({ assetUrl, env, request, context })
	}
} satisfies ExportedHandler<Env>

export { TokenList } from "./do"
export { SyncPool } from "./workflow"
