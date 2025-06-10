import { Queue, Worker, QueueEvents } from "bullmq"
import IORedis from "ioredis"
import { fileURLToPath, pathToFileURL } from "url"
import { dirname, join } from "path"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const file = join(__dirname, "workers", "sandbox.js")
const processorUrl = pathToFileURL(file)

const connection = new IORedis({ maxRetriesPerRequest: null })

const createPool = new Worker("createPool", processorUrl, {
	connection,
	concurrency: 5
})

const createPoolQueue = new Queue("createPool", { connection })
const createPoolQueueEvents = new QueueEvents("createPool", { connection })

export async function addJobs(data: any) {
	console.log("addjobs", data)
	const job = await createPoolQueue.add("createPool", data)
	const res = await job.waitUntilFinished(createPoolQueueEvents)

	return res
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
