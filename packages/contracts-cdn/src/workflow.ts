import { WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from "cloudflare:workers"
import { networks } from "@lumina-dex/sdk/constants"
import type { Env } from "../worker-configuration"
import { sync } from "./http"

export class SyncBlockchain extends WorkflowEntrypoint<Env, Params> {
	async run(event: WorkflowEvent<Params>, step: WorkflowStep) {
		await Promise.all(
			networks.map(async (network) => {
				step.do(`sync ${network}`, async () => {
					await sync({ env: this.env, context: this.ctx, network })
				})
			})
		)
	}
}
