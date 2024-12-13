import type { Networks } from "@lumina-dex/sdk"
import type { Env } from "../worker-configuration"
import type { Token } from "./helper"

interface ServeAsset {
	assetUrl: URL
	env: Env
	request: Request
	context: ExecutionContext
}

export const getDb = (env: Env) => {
	const dbDO = env.TOKENLIST.idFromName(env.DO_TOKENLIST_NAME)
	return env.TOKENLIST.get(dbDO)
}

/**
 * Serve an asset if it exists or return a 404. Use cache if possible.
 */
export const serveAsset = async ({ assetUrl, env, request, context }: ServeAsset) => {
	//Cache Key must be a Request to avoid leaking headers to other users.
	const cacheKey = new Request(assetUrl.toString(), request)
	const cache = caches.default
	const cacheResponse = await cache.match(cacheKey)
	if (cacheResponse?.ok) return cacheResponse

	const assetResponse = await env.ASSETS.fetch(assetUrl)
	const response = new Response(assetResponse.body, assetResponse)
	//Here we can control the cache headers precisely.
	if (response.ok) {
		for (const [n, v] of Object.entries(headers)) response.headers.append(n, v)
		response.headers.append("Cache-Control", "s-maxage=10")
		context.waitUntil(cache.put(cacheKey, response.clone()))
	}
	return response
}

// Fetch all tokens from the blockchain from block latest block fetched to most recent.
// Attempty to insert all the tokens in the database with onConflictDoNothing
// Save the latest block fetched in the do storage.
// TODO: We are using an external call because there's no way to use o1js with workerd.
// We would need to get rid of eval, new Function and FinalizationRegistry to be able
// to do so.
export const sync = async ({
	env,
	context,
	network
}: { env: Env; network: Networks; context: ExecutionContext }) => {
	console.log(`syncing ${network}`)
	const id = env.TOKENLIST.idFromName(env.DO_TOKENLIST_NAME)
	const tokenList = env.TOKENLIST.get(id)

	const request = new Request(`${env.LUMINA_TOKEN_ENDPOINT_URL}/${network}`, {
		headers: { Authorization: `Bearer ${env.LUMINA_TOKEN_ENDPOINT_AUTH_TOKEN}` }
	})
	const response = await fetch(request)
	if (response.ok) {
		const tokens = (await response.json()) as Token[]
		console.log({ tokens, network })
		if (tokens.length === 0) return
		const result = await tokenList.insertToken(network, tokens)
		if (result.length > 0) {
			// Only butst the cache if something changed.
			const cacheKey = tokenCacheKey(network)
			context.waitUntil(caches.default.delete(cacheKey))
		}
		result[Symbol.dispose]()
	}
}

export const tokenCacheKey = (network: string) => new URL(`http://token.key/${network}`)

export const auth = ({ env, request }: { env: Env; request: Request }) =>
	request.headers.get("Authorization") === `Bearer ${env.LUMINA_TOKEN_ENDPOINT_AUTH_TOKEN}`

export const headers = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "GET, POST"
}

export const notFound = () => new Response("Not Found", { headers, status: 404 })
