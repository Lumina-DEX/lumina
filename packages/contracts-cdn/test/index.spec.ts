import { createExecutionContext, env, waitOnExecutionContext } from "cloudflare:test"
import { describe, expect, it } from "vitest"
import worker from "../src"

const compiledJson = [
	"step-pk-poolfactory-updateverificationkey.header",
	"step-pk-faucet-claim.header",
	"step-pk-poolfactory-approvebase.header",
	"step-pk-fungibletoken-burn.header",
	"step-pk-pooltokenholder-subwithdrawliquidity.header",
	"step-pk-fungibletokenadmin-canchangeadmin.header",
	"step-pk-pool-supplyliquiditytoken.header",
	"step-pk-fungibletoken-mint.header",
	"step-pk-fungibletoken-initialize.header",
	"step-pk-fungibletoken-resume.header",
	"step-pk-fungibletoken-updateverificationkey.header",
	"step-pk-pool-supplyfirstliquiditiestoken.header",
	"step-pk-fungibletokenadmin-canpause.header",
	"step-pk-fungibletokenadmin-updateverificationkey.header",
	"step-pk-poolfactory-createpool.header",
	"step-pk-fungibletoken-pause.header",
	"step-pk-fungibletoken-transfer.header",
	"step-pk-pool-supplyfirstliquidities.header",
	"step-pk-pooltokenholder-swapfromtoken.header",
	"step-pk-fungibletoken-getbalanceof.header",
	"wrap-pk-pool.header",
	"wrap-pk-fungibletokenadmin.header",
	"step-pk-pool-swaptokenformina.header",
	"step-pk-poolfactory-createpooltoken.header",
	"step-pk-fungibletoken-approvebase.header",
	"wrap-pk-fungibletoken.header",
	"step-pk-pooltokenholder-withdrawliquidity.header",
	"step-pk-pool-withdrawliquidity.header",
	"step-pk-pooltokenholder-swapfrommina.header",
	"step-pk-pooltokenholder-withdrawliquiditytoken.header",
	"wrap-pk-poolfactory.header",
	"step-pk-pool-checkliquiditytoken.header",
	"step-pk-pool-transfer.header",
	"step-pk-pool-supplyliquidity.header",
	"step-pk-pool-getpooldata.header",
	"step-pk-fungibletokenadmin-canmint.header",
	"step-pk-faucet-approvebase.header",
	"step-pk-fungibletokenadmin-canresume.header",
	"step-pk-fungibletoken-setadmin.header",
	"step-pk-pool-setdelegator.header",
	"step-pk-fungibletoken-getdecimals.header",
	"step-pk-pool-swapminafortoken.header",
	"wrap-pk-faucet.header",
	"step-pk-pool-approvebase.header",
	"wrap-pk-pooltokenholder.header"
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
