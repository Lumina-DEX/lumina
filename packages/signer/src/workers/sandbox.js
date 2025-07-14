import { pool } from "../../drizzle/schema"
import { compileContracts } from "../helpers"
import { createPoolAndTransaction } from "./logic"

let compiled = false

/**
 * Sandbox worker to parallelize o1js proof
 * @param {import('bullmq').Job<{tokenA: string, tokenB: string, user: string, network: import('@lumina-dex/sdk').Networks}>} job
 * @returns {Promise<{ transaction: string, pool: string}>}
 */
export default async function (job) {
	try {
		await job.log("Start processing job")
		if (!compiled) await compileContracts()
		console.log("Contracts compiled")
		compiled = true
		console.log("job id", job.id)
		const result = await createPoolAndTransaction({ ...job.data, jobId: job.id })
		console.log("job end", job.id)
		return result
	} catch (error) {
		console.error(error)
		throw error
	}
}
