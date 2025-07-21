import {
	NetworkStateQuery,
	fetchAllFromPoolFactory,
	networks,
	archiveUrls,
	type urls
} from "@lumina-dex/sdk"
import { request as gqlrequest } from "graphql-request"

const server = Bun.serve({
	port: 3000,
	fetch: async (request) => {
		try {
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
	}
})

console.info(`Server is running on ${new URL(`http://${server.hostname}:${server.port}`)}`)
