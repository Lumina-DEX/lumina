import type { PubSub } from "graphql-yoga"
import type { CreatePoolInputType, JobResult } from "./graphql"
import { ensureCompiled } from "./helpers/contracts"
import { createPoolAndTransaction } from "./helpers/pool"
import { logger } from "./helpers/utils"

type JobTask = {
	jobId: string
	data: CreatePoolInputType
	pubsub: PubSub<Record<string, [JobResult]>>
}

// In-memory job cache
const jobs = new Map<string, JobResult>()

const processJob = async ({ jobId, data, pubsub }: JobTask) => {
	logger.log(`Processing job ${jobId}:`, Date.now())

	try {
		await ensureCompiled()
		const result = await createPoolAndTransaction({ ...data, jobId })
		const jobResult = {
			status: "completed",
			poolPublicKey: result.poolPublicKey,
			transactionJson: result.transactionJson,
			completedAt: Date.now()
		} as const

		jobs.set(jobId, jobResult)
		pubsub.publish(jobId, jobResult)
		logger.log(`✅ Job ${jobId} completed`)
	} catch (error) {
		logger.error(`❌ Job ${jobId} failed:`, error)

		const jobResult = {
			status: "failed",
			poolPublicKey: "",
			transactionJson: "",
			completedAt: Date.now()
		} as const

		jobs.set(jobId, jobResult)
		pubsub.publish(jobId, jobResult)
	}
}

type Worker<T> = (item: T) => Promise<void>
class Queuer<T> {
	#queue: Set<T> = new Set()
	#processing = false
	constructor(private worker: Worker<T>) {}
	public addItem(item: T) {
		this.#queue.add(item)
		if (this.#processing) return
		this.processQueue()
	}
	private async processQueue() {
		this.#processing = true
		while (this.#queue.size > 0) {
			const item = this.#queue.values().next().value
			if (!item) break
			try {
				await this.worker(item)
			} catch (error) {
				logger.error("Error processing queue item:", error)
			} finally {
				this.#queue.delete(item)
			}
		}
		this.#processing = false
	}
}

// Serial processing, one job at a time
const queuer = new Queuer<JobTask>(async (task) => await processJob(task))
export const getJobQueue = (pubsub: PubSub<Record<string, [JobResult]>>) => {
	return {
		addJob: (jobId: string, data: CreatePoolInputType) => {
			jobs.set(jobId, { status: "pending", poolPublicKey: "", transactionJson: "", completedAt: Date.now() })
			queuer.addItem({ jobId, data, pubsub })
		},
		getJob: (jobId: string) => jobs.get(jobId),
		hasJob: (jobId: string) => jobs.has(jobId),
		removeJob: (jobId: string) => {
			jobs.delete(jobId)
			logger.log(`Removed job ${jobId} from cache`)
		},
		[Symbol.dispose]: () => {
			logger.log("Disposing job queue...")
		}
	}
}
