import { compileContracts } from "../helpers"
import { createPoolAndTransaction } from "./logic"

let compiled = false

/**
 * Sandbox worker to parallelize o1js proof
 * @param {import('bullmq').Job<{tokenA: string, tokenB: string, user: string, network: import('@lumina-dex/sdk').Networks}>} job
 * @returns {Promise<{ transactionJson: string, poolPublicKey: string}>}
 */
export default async function (job) {
	try {
		await job.log(`sandbox:job_started:${job.id}`)
		if (!compiled) await compileContracts()
		await job.log("sandbox:compiled")
		compiled = true
		if (!job.id) throw new Error("No job id")
		const result = await createPoolAndTransaction({
			...job.data,
			jobId: job.id
		})
		await job.log(`sandbox:job_completed:${job.id}`)
		return result
	} catch (error) {
		console.error(error)
		throw error
	}
}
