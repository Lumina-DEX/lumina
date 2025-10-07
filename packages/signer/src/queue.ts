import { dirname, join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { Worker as BullMqWorker, Queue, QueueEvents } from "bullmq"
import IORedis from "ioredis"
import type { CreatePoolInputType } from "./graphql"
import type { createPoolAndTransaction } from "./workers/logic"

const connection = new IORedis(process.env.REDIS_URL ?? "redis://127.0.0.1:6379", {
	maxRetriesPerRequest: null
}).on("error", (e) => {
	console.error("Redis connection error:", e)
	throw e
})

const concurrency = 4

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const file = join(__dirname, "workers", "sandbox.js")
const processorUrl = pathToFileURL(file)
const worker = new BullMqWorker("createPool", processorUrl, {
	connection,
	concurrency
})

const createPoolQueue = new Queue<CreatePoolInputType, Awaited<ReturnType<typeof createPoolAndTransaction>>>(
	"createPool",
	{ connection }
)

const createPoolQueueEvents = new QueueEvents("createPool", { connection })

createPoolQueueEvents.on("waiting", ({ jobId }) => {
	console.log(`A job with ID ${jobId} is waiting`)
})

createPoolQueueEvents.on("active", ({ jobId, prev }) => {
	console.log(`Job ${jobId} is now active; previous status was ${prev}`)
})

createPoolQueueEvents.on("completed", ({ jobId }) => {
	console.log(`${jobId} has completed and returned`)
})

createPoolQueueEvents.on("failed", ({ jobId, failedReason }) => {
	console.error("queue failed", failedReason)
	console.log(`${jobId} has failed with reason ${failedReason}`)
})

export const queues = () => {
	return {
		createPoolQueue,
		createPoolQueueEvents,
		worker,
		[Symbol.dispose]: () => {
			console.log("Disposing queues...")
		}
	}
}
