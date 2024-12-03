import { createExecutionContext, env, waitOnExecutionContext } from "cloudflare:test"
import { describe, expect, it } from "vitest"
import worker from "../src"

const compiledJson = [
	"wrap-vk-fungibletokenadmin.header",
	"step-vk-fungibletokenadmin-canpause.header",
	"step-pk-poolfactory-updateverificationkey.header",
	"step-pk-fungibletokenadmin-canpause",
	"step-vk-pool-checkliquiditytoken.header",
	"wrap-vk-fungibletoken.header",
	"step-pk-faucet-claim.header",
	"step-vk-pool-supplyfirstliquidities.header",
	"step-pk-pool-swapminafortoken",
	"step-vk-fungibletokenadmin-canchangeadmin.header",
	"step-vk-fungibletoken-getdecimals.header",
	"wrap-pk-fungibletokenadmin",
	"step-vk-pool-getpooldata.header",
	"step-vk-poolfactory-createpooltoken.header",
	"step-pk-poolfactory-approvebase.header",
	"step-pk-pool-transfer",
	"step-pk-pool-withdrawliquidity",
	"step-pk-fungibletoken-burn.header",
	"wrap-vk-pooltokenholder.header",
	"step-pk-pooltokenholder-subwithdrawliquidity.header",
	"step-pk-fungibletokenadmin-canchangeadmin.header",
	"step-pk-pool-supplyliquiditytoken.header",
	"step-vk-pool-swaptokenformina.header",
	"step-pk-fungibletoken-mint.header",
	"step-pk-pooltokenholder-swapfromtoken",
	"step-vk-pool-setdelegator.header",
	"step-pk-fungibletoken-initialize.header",
	"step-vk-pool-approvebase.header",
	"step-pk-fungibletokenadmin-canresume",
	"step-vk-pooltokenholder-withdrawliquiditytoken.header",
	"step-pk-poolfactory-approvebase",
	"step-pk-fungibletoken-resume.header",
	"step-vk-poolfactory-updateverificationkey.header",
	"step-pk-fungibletoken-updateverificationkey.header",
	"step-vk-fungibletoken-transfer.header",
	"step-pk-pool-checkliquiditytoken",
	"step-pk-pool-supplyfirstliquiditiestoken.header",
	"step-pk-fungibletokenadmin-canpause.header",
	"step-pk-fungibletokenadmin-updateverificationkey.header",
	"step-vk-fungibletoken-updateverificationkey.header",
	"step-pk-poolfactory-createpool.header",
	"step-vk-fungibletoken-burn.header",
	"step-pk-fungibletoken-pause.header",
	"lagrange-basis-fp-4096.header",
	"step-pk-fungibletoken-transfer.header",
	"step-pk-pool-supplyfirstliquidities.header",
	"step-vk-poolfactory-createpool.header",
	"step-vk-pooltokenholder-swapfromtoken.header",
	"step-pk-poolfactory-createpool",
	"step-pk-pool-supplyliquidity",
	"step-pk-pooltokenholder-swapfromtoken.header",
	"step-pk-fungibletoken-getbalanceof.header",
	"step-vk-fungibletoken-resume.header",
	"step-pk-fungibletoken-setadmin",
	"wrap-pk-pool.header",
	"wrap-pk-fungibletokenadmin.header",
	"step-pk-poolfactory-updateverificationkey",
	"step-pk-pool-swaptokenformina.header",
	"step-pk-fungibletokenadmin-updateverificationkey",
	"step-pk-poolfactory-createpooltoken.header",
	"step-pk-pool-setdelegator",
	"step-vk-poolfactory-approvebase.header",
	"step-vk-fungibletoken-getbalanceof.header",
	"wrap-pk-poolfactory",
	"lagrange-basis-fp-8192.header",
	"wrap-vk-pool.header",
	"step-pk-fungibletoken-updateverificationkey",
	"step-pk-fungibletoken-approvebase.header",
	"step-pk-fungibletoken-initialize",
	"wrap-pk-fungibletoken.header",
	"step-pk-pooltokenholder-withdrawliquiditytoken",
	"step-vk-fungibletoken-mint.header",
	"step-vk-fungibletokenadmin-updateverificationkey.header",
	"step-pk-pool-approvebase",
	"step-pk-pooltokenholder-withdrawliquidity.header",
	"step-vk-fungibletoken-approvebase.header",
	"step-pk-fungibletoken-pause",
	"step-pk-pool-withdrawliquidity.header",
	"step-vk-pool-supplyfirstliquiditiestoken.header",
	"step-vk-faucet-approvebase.header",
	"step-pk-pool-getpooldata",
	"step-vk-pooltokenholder-subwithdrawliquidity.header",
	"lagrange-basis-fp-2048.header",
	"step-pk-pool-supplyfirstliquidities",
	"step-vk-pool-withdrawliquidity.header",
	"step-pk-fungibletoken-getbalanceof",
	"step-vk-pool-swapminafortoken.header",
	"step-pk-pooltokenholder-swapfrommina.header",
	"step-pk-pooltokenholder-withdrawliquiditytoken.header",
	"step-pk-fungibletoken-getdecimals",
	"wrap-pk-poolfactory.header",
	"wrap-vk-poolfactory.header",
	"step-vk-pool-supplyliquidity.header",
	"step-vk-fungibletoken-pause.header",
	"step-pk-pool-supplyliquiditytoken",
	"step-vk-pooltokenholder-withdrawliquidity.header",
	"step-vk-pooltokenholder-swapfrommina.header",
	"step-pk-pool-swaptokenformina",
	"step-pk-pooltokenholder-withdrawliquidity",
	"step-vk-pool-transfer.header",
	"step-pk-fungibletoken-transfer",
	"step-pk-pooltokenholder-swapfrommina",
	"step-pk-pool-checkliquiditytoken.header",
	"step-pk-pool-transfer.header",
	"srs-fq-32768.header",
	"step-pk-pool-supplyliquidity.header",
	"step-pk-pooltokenholder-subwithdrawliquidity",
	"step-pk-faucet-approvebase",
	"srs-fp-65536.header",
	"step-pk-fungibletokenadmin-canchangeadmin",
	"step-pk-pool-getpooldata.header",
	"step-pk-fungibletokenadmin-canmint.header",
	"step-pk-faucet-claim",
	"step-pk-faucet-approvebase.header",
	"step-pk-fungibletokenadmin-canresume.header",
	"step-vk-fungibletoken-setadmin.header",
	"step-vk-pool-supplyliquiditytoken.header",
	"wrap-pk-faucet",
	"wrap-pk-pooltokenholder",
	"step-pk-fungibletoken-setadmin.header",
	"step-pk-fungibletoken-resume",
	"wrap-vk-faucet.header",
	"step-pk-pool-setdelegator.header",
	"step-pk-fungibletokenadmin-canmint",
	"step-vk-fungibletoken-initialize.header",
	"step-pk-fungibletoken-getdecimals.header",
	"step-pk-poolfactory-createpooltoken",
	"step-pk-fungibletoken-mint",
	"lagrange-basis-fp-1024.header",
	"wrap-pk-fungibletoken",
	"step-pk-pool-supplyfirstliquiditiestoken",
	"step-pk-fungibletoken-burn",
	"step-vk-fungibletokenadmin-canmint.header",
	"step-pk-pool-swapminafortoken.header",
	"wrap-pk-pool",
	"wrap-pk-faucet.header",
	"step-pk-fungibletoken-approvebase",
	"step-pk-pool-approvebase.header",
	"wrap-pk-pooltokenholder.header",
	"step-vk-fungibletokenadmin-canresume.header",
	"step-vk-faucet-claim.header"
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
