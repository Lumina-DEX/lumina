import { createExecutionContext, env, waitOnExecutionContext } from "cloudflare:test"
import { describe, expect, it } from "vitest"
import worker from "../src"
import { cache } from "./generated-cache"

const createRequest = (url: string) =>
	new Request<unknown, IncomingRequestCfProperties>(`http://example.com/${url}`)
const cacheRequest = createRequest("api/cache")

describe("CDN Worker", () => {
	describe("Request for the list of cached files", () => {
		it("Returns the list of cached files", async () => {
			const ctx = createExecutionContext()
			const response = await worker.fetch(cacheRequest, env, ctx)
			await waitOnExecutionContext(ctx)
			const json = (await response.json()) as string[]
			expect(json.join()).toMatchInlineSnapshot(`"${cache}"`)
		})

		it("responds with cache headers", async () => {
			const ctx = createExecutionContext()
			const response = await worker.fetch(cacheRequest, env, ctx)
			await waitOnExecutionContext(ctx)
			expect(response.headers.get("cache-control")).toBe(
				"public, max-age=0, must-revalidate, s-maxage=10"
			)
		})
	})

	describe("request for /cdn-cgi/assets fails", () => {
		it("returns a 404 when the request attempts to directly fetch the asset ", async () => {
			const request = createRequest("cdn-cgi/assets/compiled.json")
			const ctx = createExecutionContext()
			const response = await worker.fetch(request, env, ctx)
			await waitOnExecutionContext(ctx)
			expect(response.status).toBe(404)
		})
	})

	describe("request for assets", () => {
		it("can return the zipped bundle", async () => {
			const request = createRequest("bundle.zip")
			const ctx = createExecutionContext()
			const response = await worker.fetch(request, env, ctx)
			await waitOnExecutionContext(ctx)
			expect(response.status).toBe(200)
		})

		it("can return a cached compiled contract", async () => {
			const request = createRequest("cache/lagrange-basis-fp-1024.txt")
			const ctx = createExecutionContext()
			const response = await worker.fetch(request, env, ctx)
			await waitOnExecutionContext(ctx)
			expect(response.status).toBe(200)
		})
	})

	describe("request for tokens", () => {
		it("can return a list of tokens", async () => {
			const request = createRequest("api/mina:testnet/tokens")
			const ctx = createExecutionContext()
			const response = await worker.fetch(request, env, ctx)
			await waitOnExecutionContext(ctx)
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const json = (await response.json()) as Record<string, any>
			expect(json.tokens[0]).toStrictEqual({
				address: "B62qjDaZ2wDLkFpt7a7eJme6SAJDuc3R3A2j2DRw7VMmJAFahut7e8w",
				poolAddress: "B62qjGnANmDdJoBhWCQpbN2v3V4CBb5u1VJSCqCVZbpS5uDs7aZ7TCH",
				tokenId: "wTRtTRnW7hZCQSVgsuMVJRvnS1xEAbRRMWyaaJPkQsntSNh67n",
				chainId: "mina:testnet",
				symbol: "TOKA",
				decimals: 9
			})
		})

		it("returns a 404 when the network doesn't exists", async () => {
			const request = createRequest("api/wtf/tokens")
			const ctx = createExecutionContext()
			const response = await worker.fetch(request, env, ctx)
			await waitOnExecutionContext(ctx)
			expect(response.status).toBe(404)
		})
	})
})
