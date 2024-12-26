import { SELF, env, fetchMock } from "cloudflare:test"
import { afterEach, beforeAll, describe, expect, it } from "vitest"

const createRequest = (url: string, method = "GET") =>
	new Request<unknown, IncomingRequestCfProperties>(`http://example.com/${url}`, { method })

beforeAll(() => {
	fetchMock.activate()
	fetchMock.disableNetConnect()
})

// Ensure we matched every mock we defined
afterEach(() => fetchMock.assertNoPendingInterceptors())

describe("API", () => {
	it("can return a list of tokens", async () => {
		const request = createRequest("api/mina:testnet/tokens")
		const response = await SELF.fetch(request)
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		const json = (await response.json()) as Record<string, any>
		// biome-ignore lint/performance/noDelete: <explanation>
		delete json.tokens[0].timestamp
		expect(json.tokens[0]).toEqual({
			address: "B62qjDaZ2wDLkFpt7a7eJme6SAJDuc3R3A2j2DRw7VMmJAFahut7e8w",
			poolAddress: "B62qjGnANmDdJoBhWCQpbN2v3V4CBb5u1VJSCqCVZbpS5uDs7aZ7TCH",
			tokenId: "wTRtTRnW7hZCQSVgsuMVJRvnS1xEAbRRMWyaaJPkQsntSNh67n",
			chainId: "mina:testnet",
			symbol: "TOKA",
			decimals: 9
		})
	})

	it("can sync the blockchain state with a scheduled event", async () => {
		//TODO: Investigate why this doesn't work
		// fetchMock
		// 	.get(env.LUMINA_TOKEN_ENDPOINT_URL)
		// 	.intercept({ path: () => true })
		// 	.reply(200, [])
		// 	.times(4)
		// const controller = createScheduledController()
		// const ctx = createExecutionContext()
		// await worker.scheduled(controller, env, ctx)
		// await waitOnExecutionContext(ctx)
	})

	it("can sync the network state and be rate limited.", async () => {
		const network = "mina:testnet"
		fetchMock
			.get(env.LUMINA_TOKEN_ENDPOINT_URL)
			.intercept({ path: `/${network}` })
			.reply(200, [])
			.times(1)
		const request = createRequest(`api/${network}/pool`, "POST")
		const response = await SELF.fetch(request)

		const decoder = new TextDecoder()
		const chunks = []
		// biome-ignore lint/style/noNonNullAssertion: <explanation>
		for await (const chunk of response.body!) {
			chunks.push(decoder.decode(chunk))
		}
		expect(chunks).toEqual([`Starting sync for ${network}...\n`, `Sync completed for ${network}`])
		SELF.fetch(request)
		const response2 = await SELF.fetch(request)
		// We send 2 request to trigger the rate limit { limit: 2, period: 10 }
		expect(response2.status).toBe(429)
	})

	it("returns a 404 when the network doesn't exists", async () => {
		const request = createRequest("api/wtf/tokens")
		const response = await SELF.fetch(request)
		expect(response.status).toBe(404)
	})

	it("can insert a token and bust the cache", async () => {
		const request1 = createRequest("api/mina:testnet/tokens")

		const response1 = await SELF.fetch(request1)
		const json = (await response1.json()) as Record<string, unknown>
		expect(json.tokens).toHaveLength(1)

		const request2 = new Request<unknown, IncomingRequestCfProperties>(
			"http://example.com/api/mina:testnet/token",
			{
				method: "POST",
				headers: { Authorization: "Bearer foo" },
				body: JSON.stringify({
					address: "testAddress",
					poolAddress: "testPoolAddress",
					tokenId: "testTokenId",
					symbol: "ABC",
					decimals: 9
				})
			}
		)
		const response2 = await SELF.fetch(request2)
		expect(response2.status).toBe(201)

		const request3 = createRequest("api/mina:testnet/tokens")
		const response3 = await SELF.fetch(request3)
		const json2 = (await response3.json()) as Record<string, unknown>
		expect(json2.tokens).toHaveLength(2)
	})
})
