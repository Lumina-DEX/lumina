import { createExecutionContext, env, waitOnExecutionContext } from "cloudflare:test"
import { describe, expect, it } from "vitest"
import worker from "../src"

const compiledJson = [
	"step-vk-fungibletokenadmin-canmint",
	"step-vk-faucet-claim",
	"step-vk-pool-setdelegator",
	"step-vk-pool-supplyfirstliquiditiestoken",
	"srs-fq-32768",
	"wrap-vk-fungibletokenadmin",
	"step-vk-pool-supplyliquidity",
	"step-vk-pooltokenholder-swapfromtoken",
	"lagrange-basis-fp-8192",
	"step-vk-pool-transfer",
	"step-vk-pooltokenholder-withdrawliquiditytoken",
	"wrap-vk-poolfactory",
	"step-vk-fungibletokenadmin-canresume",
	"lagrange-basis-fp-2048",
	"step-vk-fungibletoken-transfer",
	"step-vk-fungibletoken-updateverificationkey",
	"step-vk-poolfactory-updateverificationkey",
	"step-vk-fungibletokenadmin-canpause",
	"step-vk-fungibletoken-getbalanceof",
	"step-vk-fungibletokenadmin-updateverificationkey",
	"wrap-vk-pooltokenholder",
	"step-vk-fungibletoken-pause",
	"wrap-vk-faucet",
	"step-vk-pool-swapminafortoken",
	"step-vk-pooltokenholder-withdrawliquidity",
	"step-vk-pool-checkliquiditytoken",
	"step-vk-poolfactory-createpooltoken",
	"step-vk-fungibletoken-approvebase",
	"step-vk-fungibletoken-resume",
	"step-vk-fungibletoken-initialize",
	"step-vk-fungibletoken-setadmin",
	"step-vk-poolfactory-createpool",
	"lagrange-basis-fp-1024",
	"srs-fp-65536",
	"wrap-vk-fungibletoken",
	"step-vk-fungibletoken-getdecimals",
	"step-vk-pooltokenholder-swapfrommina",
	"step-vk-pool-swaptokenformina",
	"step-vk-pooltokenholder-subwithdrawliquidity",
	"step-vk-fungibletoken-burn",
	"wrap-vk-pool",
	"step-vk-fungibletoken-mint",
	"step-vk-pool-supplyfirstliquidities",
	"step-vk-poolfactory-approvebase",
	"step-vk-fungibletokenadmin-canchangeadmin",
	"step-vk-pool-approvebase",
	"step-vk-pool-supplyliquiditytoken",
	"step-vk-faucet-approvebase",
	"lagrange-basis-fp-4096",
	"step-vk-pool-getpooldata",
	"step-vk-pool-withdrawliquidity"
].join()

describe("CDN Worker", () => {
	describe("Request for compiled.json", () => {
		it("Returns compiled.json", async () => {
			const request = new Request<unknown, IncomingRequestCfProperties>(
				"http://example.com/compiled.json"
			)
			// Create an empty context to pass to `worker.fetch()`.
			const ctx = createExecutionContext()
			const response = await worker.fetch(request, env, ctx)
			// Wait for all `Promise`s passed to `ctx.waitUntil()` to settle before running test assertions
			await waitOnExecutionContext(ctx)
			const json = (await response.json()) as string[]
			expect(json.join()).toMatchInlineSnapshot(`"${compiledJson}"`)
		})

		it("responds with cache headers", async () => {
			const request = new Request<unknown, IncomingRequestCfProperties>(
				"http://example.com/compiled.json"
			)
			const ctx = createExecutionContext()
			const response = await worker.fetch(request, env, ctx)
			// Wait for all `Promise`s passed to `ctx.waitUntil()` to settle before running test assertions
			await waitOnExecutionContext(ctx)
			expect(response.headers.get("cache-control")).toBe(
				"public, max-age=0, must-revalidate, s-maxage=10"
			)
		})
	})

	describe("request for /cdn-cgi/assets fails", () => {
		it("returns a 404 when the request ", async () => {
			const request = new Request<unknown, IncomingRequestCfProperties>(
				"http://example.com/cdn-cgi/assets/compiled.json"
			)
			// Create an empty context to pass to `worker.fetch()`.
			const ctx = createExecutionContext()
			const response = await worker.fetch(request, env, ctx)
			// Wait for all `Promise`s passed to `ctx.waitUntil()` to settle before running test assertions
			await waitOnExecutionContext(ctx)
			expect(response.status).toBe(404)
		})
	})

	describe("request for a cached compiled contract", () => {
		it("can return a cached compiled contract", async () => {
			const request = new Request<unknown, IncomingRequestCfProperties>(
				"http://example.com/cache/lagrange-basis-fp-1024.txt"
			)
			// Create an empty context to pass to `worker.fetch()`.
			const ctx = createExecutionContext()
			const response = await worker.fetch(request, env, ctx)
			// Wait for all `Promise`s passed to `ctx.waitUntil()` to settle before running test assertions
			await waitOnExecutionContext(ctx)
			expect(response.status).toBe(200)
		})
	})
})
