import { dirname, join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { Queue, QueueEvents, Worker } from "bullmq"
import IORedis from "ioredis"
import type { CreatePoolInputType } from "./graphql"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const file = join(__dirname, "workers", "sandbox.js")
const processorUrl = pathToFileURL(file)

const connection = new IORedis({
	host: process.env.REDIS_HOST ?? "127.0.0.1",
	port: Number(process.env.REDIS_PORT ?? 6379),
	maxRetriesPerRequest: null
})

const concurrency = 3

const worker = new Worker("createPool", processorUrl, {
	connection,
	concurrency
})

export const createPoolQueue = new Queue<CreatePoolInputType, { something: "" }>("createPool", {
	connection
})
export const createPoolQueueEvents = new QueueEvents("createPool", {
	connection
})

export const getQueues = () => {
	return {
		createPoolQueue,
		createPoolQueueEvents,
		worker
	}
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
	console.error("queue failed", failedReason)
	console.log(`${jobId} has failed with reason ${failedReason}`)
})
