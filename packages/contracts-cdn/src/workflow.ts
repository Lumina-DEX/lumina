//WIP
import { WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from "cloudflare:workers"
import type { Env } from "../worker-configuration"

import { type Networks, internal_fetchAllPoolTokens } from "@lumina-dex/sdk"

// biome-ignore lint/suspicious/noExplicitAny: Generic Type
export const processSettledPromises = <T extends any[]>(
	settledPromises: {
		[P in keyof T]: PromiseSettledResult<T[P]>
	}
): T => {
	return settledPromises.map((result) => {
		if (result.status === "rejected") throw new Error(result.reason)
		return result.value
	}) as T
}
const generateTokens = async (network: Networks) => {
	const tokens = await internal_fetchAllPoolTokens(network)
	return processSettledPromises(tokens)
}

const sync = () => {
	// Fetch all tokens from the blockchain from block latest block fetched to most recent.
	// Attempty to insert all the tokens in the database with onConflictDoNothing
	// Save the latest block fetched in the do storage.
}

// Create your own class that implements a Workflow
export class SyncBlockchainState extends WorkflowEntrypoint<Env, Params> {
	// Define a run() method
	async run(event: WorkflowEvent<Params>, step: WorkflowStep) {
		const id = this.env.TOKENLIST.idFromName("/path")
		const stub = this.env.TOKENLIST.get(id)

		step.do("sync mina:testnet", async () => {})
		step.do("sync mina:mainnet", async () => {})
		step.do("sync mina:berkeley", async () => {})
		step.do("sync zeko:testnet", async () => {})
		step.do("sync zeko:mainnet", async () => {})
	}
}
