import {
	type Networks,
	internal_fetchAllTokensFromPoolFactory,
	networks
} from "npm:@lumina-dex/sdk"

export const processSettledPromises = <T>(settledPromises: PromiseSettledResult<T>[]) => {
	return settledPromises.flatMap((result) => {
		if (result.status === "rejected") throw new Error(result.reason)
		return result.value
	})
}

const generateTokens = async (network: Networks) => {
	const tokens = await internal_fetchAllTokensFromPoolFactory({ network })
	return processSettledPromises(tokens)
}

Deno.serve(async (request) => {
	try {
		// Get the authorization header
		const auth = request.headers.get("Authorization")

		// Get the AUTH_TOKEN from environment variables
		const expectedToken = Deno.env.get("AUTH_TOKEN")

		// Check if auth header exists and matches the expected token
		if (!auth || auth !== `Bearer ${expectedToken}`) {
			return new Response("Unauthorized", { status: 401 })
		}

		// Extract pathname from URL
		const url = new URL(request.url)
		const network = url.pathname.slice(1) as Networks // Remove leading slash
		if (networks.includes(network) === false) {
			return new Response("Invalid Network", { status: 400 })
		}
		//TODO: This should accept a specific block height to start searching from
		const tokens = await generateTokens(network)
		// console.log({ network, tokens })
		// Return JSON response
		//TODO: This should return `end` as the latest known block height and `start` as the block height where the search started
		return new Response(JSON.stringify(tokens), {
			headers: { "Content-Type": "application/json" }
		})
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
