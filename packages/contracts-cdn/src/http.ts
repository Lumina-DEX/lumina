import { getRandom } from "@cloudflare/containers"
import type { LuminaPool, LuminaToken, Networks } from "@lumina-dex/sdk"

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
	const id = env.TOKENLIST.idFromName(env.DO_TOKENLIST_NAME)
	const tokenList = env.TOKENLIST.get(id)

	const url = `http://localhost/${network}`
	console.log(`Syncing tokens from ${url} for network ${network}`)
	// TODO: Fix when autoscaling is released https://developers.cloudflare.com/containers/scaling-and-routing/#autoscaling-and-routing-unreleased
	const container = await getRandom(env.FETCHTOKEN, 1)
	const response = await container.fetch(url, { method: "GET" })
	console.log(`Response from ${url}:`, response.status, response.statusText)
	if (response.ok) {
		const data = (await response.json()) as { tokens: LuminaToken[]; pools: LuminaPool[] }
		const { tokens, pools } = data
		if (tokens.length === 0) return
		//TODO: Do this without reseting the database after every sync. We should add some logic to only insert the new tokens.
		await tokenList.reset({ network })
		const result = await tokenList.insertToken(tokens)
		const poolResult = await tokenList.insertPool(
			pools.map((pool) => ({
				...pool,
				token0Address: pool.tokens[0].address,
				token1Address: pool.tokens[1].address
			}))
		)
		// Only bust the cache if something changed.
		if (result.length > 0 || poolResult.length > 0) {
			const tKey = tokenCacheKey(network)
			const pKey = poolCacheKey(network)
			context.waitUntil(caches.default.delete(tKey))
			context.waitUntil(caches.default.delete(pKey))
			return { tokens, pools, network, cacheBusted: { token: tKey, pool: pKey } }
		}
		return { tokens, pools, network, cacheBusted: false }
	}
	return []
}

export const tokenCacheKey = (network: string) => new URL(`http://token.key/${network}`)
export const poolCacheKey = (network: string) => new URL(`http://pool.key/${network}`)

export const auth = ({ env, request }: { env: Env; request: Request }) =>
	request.headers.get("Authorization") === `Bearer ${env.LUMINA_TOKEN_ENDPOINT_AUTH_TOKEN}`

export const headers = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "GET, POST"
}

export const notFound = () => new Response("Not Found", { headers, status: 404 })
