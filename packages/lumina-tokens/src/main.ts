import { NetworkStateQuery, fetchAllFromPoolFactory, networks } from "npm:@lumina-dex/sdk"
import { archiveUrls, urls } from "npm:@lumina-dex/sdk/constants"
import { request as gqlrequest } from "npm:graphql-request"

Deno.serve(async (request) => {
	try {
		// Get the authorization header
		const auth = request.headers.get("Authorization")

		// Get the AUTH_TOKEN from environment variables
		const expectedToken = Deno.env.get("AUTH_TOKEN")

		// Check if auth header exists and matches the expected token
		if (!auth || auth !== `Bearer ${expectedToken}`)
			return new Response("Unauthorized", { status: 401 })

		// Extract pathname from URL
		const url = new URL(request.url)
		const params = new URLSearchParams(url.search)
		const from = params.get("from")
		const network = url.pathname.slice(1) as keyof typeof urls // Remove leading slash
		const archiveUrl = archiveUrls[network]
		if (networks.includes(network) === false)
			return new Response("Invalid Network", { status: 400 })

		const [{ tokens, pools, currentBlock, startBlock }, { networkState }] = await Promise.all([
			fetchAllFromPoolFactory({ network, from: from ? Number(from) : undefined }),
			network.includes("zeko")
				? Promise.resolve({ networkState: { maxBlockHeight: null } })
				: gqlrequest(archiveUrl, NetworkStateQuery)
		])
		return new Response(
			JSON.stringify({ tokens: Array.from(tokens.values()), pools: Array.from(pools.values()) }),
			{
				headers: {
					"X-Block-Start": startBlock.toString(),
					"X-Block-Current": currentBlock.toString(),
					"X-Block-Archive-Canonical":
						networkState.maxBlockHeight?.canonicalMaxBlockHeight.toString() ?? "unknown",
					"X-Block-Archive-Pending":
						networkState.maxBlockHeight?.pendingMaxBlockHeight.toString() ?? "unknown",
					"Content-Type": "application/json"
				}
			}
		)
	} catch (e) {
		// Handle errors gracefully
		console.error(e)
		const error = e instanceof Error ? e : new Error("Internal Server Error")
		return new Response(JSON.stringify({ error: error?.message }), {
			status: 500,
			headers: { "Content-Type": "application/json" }
		})
	}
})
