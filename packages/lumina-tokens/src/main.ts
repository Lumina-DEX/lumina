import { type Networks, internal_fetchAllPoolTokens, networks } from "@lumina-dex/sdk"

// deno-lint-ignore no-explicit-any
const processSettledPromises = <T extends any[]>(
	settledPromises: {
		[P in keyof T]: PromiseSettledResult<T[P]>
	}
): T => {
	return settledPromises.map((result) => {
		if (result.status === "rejected") throw new Error(result.reason)
		return result.value
	}) as T
}

const generateTokens = async (network: Networks) => {
	const tokens = await internal_fetchAllPoolTokens(network)
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
		const tokens = await generateTokens(network)
		console.log({ network, tokens })
		// Return JSON response
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
