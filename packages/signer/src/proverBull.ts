import { Queue, Worker, QueueEvents } from "bullmq"
import IORedis from "ioredis"

import {
	AccountUpdate,
	Cache,
	fetchAccount,
	Mina,
	PublicKey,
	setNumberOfWorkers,
	UInt64
} from "o1js"

const connection = new IORedis({ maxRetriesPerRequest: null })

const createPool = new Queue("createPool", { connection })
const createPoolQueueEvents = new QueueEvents("createPool", { connection })
await createPool.setGlobalConcurrency(5)

export async function addJobs(data: any) {
	const job = await createPool.add("job", data)

	const res = await job.waitUntilFinished(createPoolQueueEvents)

	return res
	//console.log("res", res);
}

createPoolQueueEvents.on("waiting", ({ jobId }) => {
	console.log(`A job with ID ${jobId} is waiting`)
})

createPoolQueueEvents.on("active", ({ jobId, prev }) => {
	console.log(`Job ${jobId} is now active; previous status was ${prev}`)
})

createPoolQueueEvents.on("completed", ({ jobId, returnvalue }) => {
	console.log(`${jobId} has completed and returned ${returnvalue}`)
})

createPoolQueueEvents.on("failed", ({ jobId, failedReason }) => {
	console.log(`${jobId} has failed with reason ${failedReason}`)
})
