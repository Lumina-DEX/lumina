import { SELF } from "cloudflare:test"
import { describe, expect, it } from "vitest"

const createRequest = (url: string, method = "GET") =>
	new Request<unknown, IncomingRequestCfProperties>(`http://example.com/${url}`, { method })

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
		//TODO: Find a way to mock the external call.
		// const response = await SELF.scheduled()
		// const json = (await response.json()) as Record<string, unknown>
		// expect(json.tokens).toHaveLength(2)
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
