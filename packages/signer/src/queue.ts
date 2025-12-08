import type { PubSub } from "graphql-yoga"
import type { CreatePoolInputType, DeployFactoryInputType, FactoryJobResult, JobResult } from "./graphql"
import { ensureCompiled } from "./helpers/contracts"
import { deployFactoryAndTransaction } from "./helpers/factory"
import { createPoolAndTransaction } from "./helpers/pool"
import { logger } from "./helpers/utils"

export type AnyJobResult = JobResult | FactoryJobResult

type JobTask = {
	jobId: string
	data: CreatePoolInputType | DeployFactoryInputType
	pubsub: PubSub<Record<string, [AnyJobResult]>>
}

// In-memory job cache
const jobs = new Map<string, AnyJobResult>()

export const jobKey = (job: AnyJobResult) => ("poolPublicKey" in job ? job.poolPublicKey : job.factoryPublicKey)

const isFactoryJob = (data: CreatePoolInputType | DeployFactoryInputType): data is DeployFactoryInputType => {
	return "deployer" in data
}

const isPoolJob = (data: CreatePoolInputType | DeployFactoryInputType): data is CreatePoolInputType => {
	return "user" in data && "tokenA" in data && "tokenB" in data
}

const processJob = async ({ jobId, data, pubsub }: JobTask) => {
	logger.log(`Processing job ${jobId}:`, Date.now())

	try {
		await ensureCompiled(data.network)

		if (isFactoryJob(data)) {
			logger.log(`Processing factory deployment job ${jobId}`)
			const result = await deployFactoryAndTransaction({ ...data, jobId })
			const jobResult: FactoryJobResult = {
				status: "completed",
				factoryPublicKey: result.factoryPublicKey,
				transactionJson: result.transactionJson,
				completedAt: new Date()
			}

			jobs.set(jobId, jobResult)
			pubsub.publish(jobId, jobResult)
			logger.log(`✅ Factory deployment job ${jobId} completed`)
		} else if (isPoolJob(data)) {
			logger.log(`Processing pool creation job ${jobId}`)
			const result = await createPoolAndTransaction({ ...data, jobId })
			const jobResult: JobResult = {
				status: "completed",
				poolPublicKey: result.poolPublicKey,
				transactionJson: result.transactionJson,
				completedAt: new Date()
			}

			jobs.set(jobId, jobResult)
			pubsub.publish(jobId, jobResult)
			logger.log(`✅ Pool creation job ${jobId} completed`)
		} else {
			throw new Error(`Unknown job type for job ${jobId}`)
		}
	} catch (error) {
		logger.error(`❌ Job ${jobId} failed:`, error)

		let jobResult: AnyJobResult
		if (isFactoryJob(data)) {
			jobResult = {
				status: "failed",
				factoryPublicKey: error instanceof Error ? error.message : "Unknown error",
				transactionJson: "",
				completedAt: new Date()
			} as FactoryJobResult
		} else {
			jobResult = {
				status: "failed",
				poolPublicKey: error instanceof Error ? error.message : "Unknown error",
				transactionJson: "",
				completedAt: new Date()
			} as JobResult
		}

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

export const getJobQueue = (pubsub: PubSub<Record<string, [AnyJobResult]>>) => {
	return {
		addJob: (jobId: string, data: CreatePoolInputType | DeployFactoryInputType) => {
			if (isFactoryJob(data)) {
				jobs.set(jobId, {
					status: "pending",
					factoryPublicKey: "",
					transactionJson: "",
					completedAt: new Date()
				} as FactoryJobResult)
			} else {
				jobs.set(jobId, {
					status: "pending",
					poolPublicKey: "",
					transactionJson: "",
					completedAt: new Date()
				} as JobResult)
			}
			queuer.addItem({ jobId, data, pubsub })
		},
		getJob: (jobId: string) => jobs.get(jobId),
		getFactoryJob: (jobId: string) => jobs.get(jobId) as FactoryJobResult | undefined,
		getPoolJob: (jobId: string) => jobs.get(jobId) as JobResult | undefined,
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
