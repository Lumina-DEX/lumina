//WIP
import { WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from "cloudflare:workers"
import type { Env } from "../worker-configuration"

import type { Networks } from "@lumina-dex/sdk"
import { networks } from "@lumina-dex/sdk/constants"
import type { Token } from "./helper"

// Fetch all tokens from the blockchain from block latest block fetched to most recent.
// Attempty to insert all the tokens in the database with onConflictDoNothing
// Save the latest block fetched in the do storage.
// TODO: Find a way to use o1js with workerd
export const sync = async ({ env, network }: { env: Env; network: Networks }) => {
	console.log(`syncing ${network}`)
	const id = env.TOKENLIST.idFromName(env.DO_TOKENLIST_NAME)
	const tokenList = env.TOKENLIST.get(id)

	const request = new Request(`${env.LUMINA_TOKEN_ENDPOINT_URL}/${network}`, {
		headers: { Authorization: `Bearer ${env.LUMINA_TOKEN_ENDPOINT_AUTH_TOKEN}` }
	})
	const response = await fetch(request)
	const tokens = (await response.json()) as Token[]
	console.log({ tokens, network })
	if (response.ok) {
		if (tokens.length === 0) return
		await tokenList.insertToken(network, tokens)
	}
}

export class SyncBlockchain extends WorkflowEntrypoint<Env, Params> {
	async run(event: WorkflowEvent<Params>, step: WorkflowStep) {
		await Promise.all(
			networks.map(async (network) => {
				step.do(`sync ${network}`, async () => {
					await sync({ env: this.env, network })
				})
			})
		)
	}
}
