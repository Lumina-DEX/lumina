import {
	SELF,
	createExecutionContext,
	createScheduledController,
	env,
	fetchMock,
	waitOnExecutionContext
} from "cloudflare:test"
import { afterEach, beforeAll, describe, expect, it } from "vitest"
import type { PoolWithTokens, Token } from "../src/helper"
import worker from "../src/index"

declare module "cloudflare:test" {
	interface ProvidedEnv extends Env {}
}

const createRequest = (url: string, method = "GET") =>
	new Request<unknown, IncomingRequestCfProperties>(`http://example.com/${url}`, { method })

// const emptyData = { tokens: [], pools: [] }
beforeAll(() => {
	fetchMock.activate()
	fetchMock.disableNetConnect()
})

// Ensure we matched every mock we defined
afterEach(() => fetchMock.assertNoPendingInterceptors())

describe("API", () => {
	it("can return a list of tokens", async () => {
		const request = createRequest("api/mina:devnet/tokens")
		const response = await SELF.fetch(request)
		const tokens = (await response.json()) as Token[]
		// biome-ignore lint/performance/noDelete: <explanation>
		delete tokens[1]?.timestamp
		expect(tokens[1]).toEqual({
			address: "B62qjDaZ2wDLkFpt7a7eJme6SAJDuc3R3A2j2DRw7VMmJAFahut7e8w",
			tokenId: "wTRtTRnW7hZCQSVgsuMVJRvnS1xEAbRRMWyaaJPkQsntSNh67n",
			chainId: "mina:devnet",
			symbol: "TOKA",
			decimals: 9
		})
	})

	it("can return a list of pools", async () => {
		const request = createRequest("api/mina:devnet/pools")
		const response = await SELF.fetch(request)
		const pools = (await response.json()) as PoolWithTokens[]
		// biome-ignore lint/performance/noDelete: <explanation>
		delete pools[0]?.timestamp
		// biome-ignore lint/performance/noDelete: <explanation>
		delete pools[0]?.tokens[0]?.timestamp
		// biome-ignore lint/performance/noDelete: <explanation>
		delete pools[0]?.tokens[1]?.timestamp

		expect(pools[0]).toEqual({
			address: "pool_test_address",
			token0Address: "MINA",
			token1Address: "B62qjDaZ2wDLkFpt7a7eJme6SAJDuc3R3A2j2DRw7VMmJAFahut7e8w",
			chainId: "mina:devnet",
			name: "LLP-MINA_TOKA",
			tokens: [
				{
					address: "MINA",
					tokenId: "MINA",
					symbol: "MINA",
					chainId: "mina:devnet",
					decimals: 9
				},
				{
					address: "B62qjDaZ2wDLkFpt7a7eJme6SAJDuc3R3A2j2DRw7VMmJAFahut7e8w",
					tokenId: "wTRtTRnW7hZCQSVgsuMVJRvnS1xEAbRRMWyaaJPkQsntSNh67n",
					symbol: "TOKA",
					chainId: "mina:devnet",
					decimals: 9
				}
			]
		})
	})

	it("can sync the blockchain state with a scheduled event", async () => {
		// fetchMock
		// 	.get(env.LUMINA_TOKEN_ENDPOINT_URL)
		// 	.intercept({ path: () => true })
		// 	.reply(200, emptyData)
		// 	.times(4)

		const controller = createScheduledController()
		const ctx = createExecutionContext()
		await worker.scheduled(controller, env, ctx)
		await waitOnExecutionContext(ctx)
	})

	it("can sync the network state and be rate limited.", async () => {
		const network = "mina:devnet"
		// fetchMock
		// 	.get(env.LUMINA_TOKEN_ENDPOINT_URL)
		// 	.intercept({ path: `/${network}` })
		// 	.reply(200, emptyData)
		// 	.times(1)
		const request = createRequest(`api/${network}/sync`, "POST")
		const response = await SELF.fetch(request)

		const decoder = new TextDecoder()
		const chunks = []
		// biome-ignore lint/style/noNonNullAssertion: <explanation>
		for await (const chunk of response.body!) {
			chunks.push(decoder.decode(chunk))
		}
		expect(chunks).toEqual([
			`Starting sync for ${network}...\n`,
			"{}\n",
			`Sync completed for ${network}`
		])
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
		const request1 = createRequest("api/mina:devnet/tokens")

		const response1 = await SELF.fetch(request1)
		const tokens = (await response1.json()) as Token[]
		expect(tokens).toHaveLength(2)

		const request2 = new Request<unknown, IncomingRequestCfProperties>(
			"http://example.com/api/mina:devnet/token",
			{
				method: "POST",
				headers: { Authorization: "Bearer foo" },
				body: JSON.stringify({
					address: "testAddress",
					tokenId: "testTokenId",
					chainId: "mina:devnet",
					symbol: "ABC",
					decimals: 9
				})
			}
		)
		const response2 = await SELF.fetch(request2)
		expect(response2.status).toBe(201)

		const request3 = createRequest("api/mina:devnet/tokens")
		const response3 = await SELF.fetch(request3)
		const tokens2 = (await response3.json()) as Token[]
		expect(tokens2).toHaveLength(3)
	})

	it("can insert a pool and bust the cache", async () => {
		const request1 = createRequest("api/mina:devnet/pools")
		const response1 = await SELF.fetch(request1)
		const pools1 = (await response1.json()) as PoolWithTokens[]
		expect(pools1).toHaveLength(1)

		const request2 = new Request<unknown, IncomingRequestCfProperties>(
			"http://example.com/api/mina:devnet/pool",
			{
				method: "POST",
				headers: { Authorization: "Bearer foo" },
				body: JSON.stringify({
					address: "test_pool_address",
					token0Address: "token0_address",
					token1Address: "token1_address",
					chainId: "mina:devnet",
					name: "TEST_POOL"
				})
			}
		)
		const response2 = await SELF.fetch(request2)
		expect(response2.status).toBe(201)

		const request3 = createRequest("api/mina:devnet/pools")
		const response3 = await SELF.fetch(request3)
		const pools3 = (await response3.json()) as PoolWithTokens[]
		expect(pools3).toHaveLength(2)
	})

	it("can reset the network state", async () => {
		const network = "mina:devnet"
		// fetchMock
		// 	.get(env.LUMINA_TOKEN_ENDPOINT_URL)
		// 	.intercept({ path: `/${network}` })
		// 	.reply(200, emptyData)
		// 	.times(1)

		// Verify that we have initial seeded data
		const request1 = createRequest("api/mina:devnet/tokens")
		const response1 = await SELF.fetch(request1)
		const tokens = (await response1.json()) as Token[]
		expect(tokens).toHaveLength(2)

		const requestPools = createRequest("api/mina:devnet/pools")
		const responsePools = await SELF.fetch(requestPools)
		const pools = (await responsePools.json()) as PoolWithTokens[]
		expect(pools).toHaveLength(1)

		// Reset the network
		const request2 = createRequest(`api/${network}/reset`, "POST")
		const response2 = await SELF.fetch(request2)
		expect(response2.status).toBe(200)

		// Verify that we have no tokens and pools
		const request3 = createRequest("api/mina:devnet/tokens")
		const response3 = await SELF.fetch(request3)
		const tokens3 = (await response3.json()) as Token[]
		expect(tokens3).toHaveLength(0)

		const requestPools2 = createRequest("api/mina:devnet/pools")
		const responsePools2 = await SELF.fetch(requestPools2)
		const pools2 = (await responsePools2.json()) as PoolWithTokens[]
		expect(pools2).toHaveLength(0)
	})
})
