import type { Networks } from "@lumina-dex/sdk"
import SchemaBuilder from "@pothos/core"
import { eq } from "drizzle-orm"
import { GraphQLError } from "graphql"
import { type GraphQLSchemaWithContext, Repeater, type YogaInitialContext } from "graphql-yoga"
import { pool } from "../drizzle/schema"
import type { Context } from "."
import { updateStatusAndCDN } from "./helpers"

type Builder = {
	Context: Context
}

const builder = new SchemaBuilder<Builder>({})

interface Job {
	id: string
	status: string
}
const Job = builder.objectRef<Job>("Job").implement({
	description: "A job representing a pool creation task",
	fields: (t) => ({
		id: t.exposeString("id"),
		status: t.exposeString("status")
	})
})

interface JobResult {
	status: string
	poolPublicKey: string
	transactionJson: string
}
const JobResult = builder.objectRef<JobResult>("JobResult").implement({
	description: "A job result represented in JSON format",
	fields: (t) => ({
		status: t.exposeString("status", { nullable: false }),
		poolPublicKey: t.exposeString("poolPublicKey", { nullable: false }),
		transactionJson: t.exposeString("transactionJson", { nullable: false })
	})
})

const NetworkType = {
	mina_mainnet: "mina:mainnet",
	mina_devnet: "mina:devnet",
	zeko_mainnet: "zeko:mainnet",
	zeko_testnet: "zeko:testnet"
} as const satisfies Record<string, Networks>

const NetworkEnum = builder.enumType("Network", {
	values: Object.fromEntries(Object.entries(NetworkType).map(([name, value]) => [name, { value }]))
})

export type CreatePoolInputType = {
	user: string
	tokenA: string
	tokenB: string
	network: Networks
}

const CreatePoolInput = builder.inputRef<CreatePoolInputType>("CreatePoolInput").implement({
	description: "Input type for creating a new pool",
	fields: (t) => ({
		user: t.string({ required: true }),
		tokenA: t.string({ required: true }),
		tokenB: t.string({ required: true }),
		network: t.field({ type: NetworkEnum, required: true })
	})
})

builder.mutationField("createPool", (t) =>
	t.field({
		type: Job,
		description: "Create a new pool",
		args: { input: t.arg({ type: CreatePoolInput, required: true }) },
		resolve: async (_, { input }, { queues }) => {
			using q = queues()
			const jobId = globalThis.crypto.randomUUID()
			const job = await q.createPoolQueue.getJob(jobId)
			console.log(`Job ID: ${jobId}, Exists: ${!!job}`)
			if (await job?.isCompleted()) return { id: jobId, status: "completed" }
			if (job) return { id: jobId, status: "exists" }
			await q.createPoolQueue.add("createPool", input, {
				jobId,
				removeOnFail: true,
				removeOnComplete: false
			})
			console.log(`Enqueued job with ID: ${jobId}`)
			return { id: jobId, status: "created" }
		}
	})
)

builder.subscriptionField("poolCreation", (t) =>
	t.field({
		type: JobResult,
		description: "Subscribe to pool creation events",
		args: { jobId: t.arg.string({ required: true }) },
		subscribe: async (_, args, { queues }) => {
			console.log(`Subscribing to pool creation events for job ID: ${args.jobId}`)
			return new Repeater<JobResult>(async (push, stop) => {
				using q = queues()
				const job = await q.createPoolQueue.getJob(args.jobId)
				if (!job) throw new GraphQLError(`Job with ID ${args.jobId} not found`)
				if (await job.isCompleted()) {
					console.log(`Job ID: ${args.jobId} already completed`)
					push({ status: "already_completed", ...job.returnvalue })
					return stop()
				}
				const completed = q.createPoolQueueEvents.on("completed", async ({ jobId }) => {
					console.log(`Repeater completed for job ID: ${jobId}`)
					if (jobId !== args.jobId) return
					const job = await q.createPoolQueue.getJob(jobId)
					if (!job) return stop(new GraphQLError(`Job with ID ${jobId} not found`))
					push({ status: "just_completed", ...job.returnvalue })
					return stop()
				})
				const failed = q.createPoolQueueEvents.on("failed", ({ jobId, failedReason }) => {
					console.error(`Repeater failed for job ID: ${jobId} with reason: ${failedReason}`)
					if (jobId !== args.jobId) return
					return stop(new GraphQLError(`Job ${jobId} failed: ${failedReason}`))
				})
				await stop
				if (completed) completed.close()
				if (failed) failed.close()
			})
		},
		resolve: (transaction) => transaction
	})
)

builder.queryField("poolCreationJob", (t) =>
	t.field({
		type: JobResult,
		description: "Get the pool creation job",
		args: { jobId: t.arg.string({ required: true }) },
		resolve: async (_, { jobId }, { queues }) => {
			using q = queues()
			const job = await q.createPoolQueue.getJob(jobId)
			if (!job) {
				console.error(`Job with ID ${jobId} not found`)
				throw new GraphQLError(`Job with ID ${jobId} not found`)
			}
			const status = await job.getState()
			const result = { status, ...job.returnvalue } as Partial<JobResult>
			console.log(`Job ID: ${jobId}, Status: ${status}, Result: ${JSON.stringify(result)}`)
			return { status: "unknown", transactionJson: "", poolPublicKey: "", ...result }
		}
	})
)

builder.mutationField("confirmJob", (t) =>
	t.field({
		type: "String",
		description: "Confirm a job with a given jobId",
		args: { jobId: t.arg.string({ required: true }) },
		resolve: async (_, { jobId }, { database, queues, shouldUpdateCDN }) => {
			using q = queues()
			using db = database()
			const data = await db.drizzle.select().from(pool).where(eq(pool.jobId, jobId))
			if (data.length === 0) {
				console.error(`No pool found for job ID ${jobId}`)
				throw new GraphQLError(`No pool found for job ID ${jobId}`)
			}
			const job = await q.createPoolQueue.getJob(jobId)
			if (job) {
				console.log(`Removing job with ID ${jobId} from the queue`)
				await job.remove()
			}
			if (data[0].status === "confirmed") {
				console.log(`Job for pool ${jobId} is already confirmed`)
				return `Job for pool ${jobId} is already confirmed`
			}
			await db.drizzle.update(pool).set({ status: "confirmed" }).where(eq(pool.jobId, jobId))
			console.log(`Job for pool ${jobId} confirmed in the database`)
			const { network, publicKey: poolAddress } = data[0]
			if (shouldUpdateCDN) {
				console.log(`Updating CDN for pool ${poolAddress} on network ${network}`)
				const result = await updateStatusAndCDN({ poolAddress, network })
				return `Job for pool "${poolAddress}" confirmed and CDN updated: ${result}`
			}
			return `Job for pool "${poolAddress}" confirmed`
		}
	})
)

builder.queryType()
builder.mutationType()
builder.subscriptionType()

export const schema: GraphQLSchemaWithContext<Context & YogaInitialContext> = builder.toSchema()
