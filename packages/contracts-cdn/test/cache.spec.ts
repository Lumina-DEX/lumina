import { createExecutionContext, env, waitOnExecutionContext } from "cloudflare:test"
import { describe, expect, it } from "vitest"
import worker from "../src"
import { cache } from "./generated-cache"

const createRequest = (url: string) =>
	new Request<unknown, IncomingRequestCfProperties>(`http://example.com/${url}`)
const cacheRequest = createRequest("api/cache")

describe("Cache and CDN", () => {
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
})
