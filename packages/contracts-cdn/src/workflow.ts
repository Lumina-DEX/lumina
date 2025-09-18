import { WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from "cloudflare:workers"
import { getContainer } from "@cloudflare/containers"
import type { Networks } from "@lumina-dex/sdk"
import { type TokensAndPools, updateTokensAndPools } from "./http"
import { updatePool } from "./supabase"

export interface WaitForPoolParams {
	network: Networks
	poolAddress: string
}

export class SyncPool extends WorkflowEntrypoint<Env, WaitForPoolParams> {
	async run(event: WorkflowEvent<WaitForPoolParams>, step: WorkflowStep) {
		const { network, poolAddress } = event.payload
		const id = `${network}_${poolAddress}`
		const container = getContainer(this.env.FETCHTOKEN, id)

		const { tokens, pools } = await step.do(
			"Check if pool exists",
			{ retries: { limit: 10, backoff: "linear", delay: "1 minutes" } },
			async () => {
				const response = await container.fetch(`http://localhost/${network}`)
				console.log(`Response status: ${response.status}, statusText: ${response.statusText}`)
				if (!response.ok)
					throw new Error(
						`Failed to fetch from container: ${response.status} ${response.statusText}`
					)
				const data = (await response.json()) as TokensAndPools
				const exists = data.pools.find((pool) => pool.address === poolAddress)
				if (!exists) throw new Error(`Pool ${poolAddress} not found on network ${network}`)
				console.log(`Pool ${poolAddress} found on network ${network}`)
				return data
			}
		)

		await Promise.all([
			step.do("Update CDN database", async () => {
				await updateTokensAndPools({ env: this.env, context: this.ctx, network, tokens, pools })
			}),
			step.do("Update Signer database", async () => {
				await updatePool({ env: this.env, poolAddress, network })
			})
		])
	}
}
