import type { Networks } from "@lumina-dex/sdk"
import SchemaBuilder from "@pothos/core"
import { Job as bullmqJob } from "bullmq"
import { eq } from "drizzle-orm"
import { JSONObjectResolver } from "graphql-scalars"
import { type GraphQLSchemaWithContext, Repeater, type YogaInitialContext } from "graphql-yoga"
import { hash } from "ohash"
import { pool } from "../drizzle/schema"
import type { Context } from "."

type Builder = {
	Context: Context
	Scalars: {
		JSONObject: {
			Input: Record<string, unknown>
			Output: Record<string, unknown>
		}
	}
}

const builder = new SchemaBuilder<Builder>({})

interface Job {
	id: string
}
const Job = builder.objectRef<Job>("Job").implement({
	description: "A job representing a pool creation task",
	fields: (t) => ({ id: t.exposeString("id") })
})

interface JobResult {
	pool: string
	transactionJson: Record<string, unknown>
}
const JobResult = builder.objectRef<JobResult>("JobResult").implement({
	description: "A job result represented in JSON format",
	fields: (t) => ({
		pool: t.field({ type: "String", resolve: (r) => r.pool }),
		transactionJson: t.field({
			type: "JSONObject",
			resolve: (r) => r.transactionJson
		})
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
		resolve: async (_, { input }, { queues: { createPoolQueue } }) => {
			const jobId = hash(input)
			const exists = await createPoolQueue.getJob(jobId)
			console.log(`Checking if job with ID ${jobId} exists:`, exists ? "Yes" : "No")
			if (!exists) {
				const job = await createPoolQueue.add("createPool", input, { jobId, removeOnFail: true })
				console.log(`Job created with ID: ${job.id}, status: ${job.isActive} `)
			}
			return { id: jobId }
		}
	})
)

builder.subscriptionField("poolCreation", (t) =>
	t.field({
		type: JobResult,
		description: "Subscribe to pool creation events",
		args: { jobId: t.arg.string({ required: true }) },
		subscribe: async (_, args, { queues: { createPoolQueue, createPoolQueueEvents } }) => {
			console.log(`Subscribing to pool creation events for job ID: ${args.jobId}`)
			const job = await createPoolQueue.getJob(args.jobId)
			if (!job) throw new Error(`Job with ID ${args.jobId} not found`)
			return new Repeater<JobResult>(async (push, stop) => {
				const listener = createPoolQueueEvents.on("completed", async ({ jobId }) => {
					if (jobId !== args.jobId) return
					console.log(`${jobId} has completed.`)
					const job = await bullmqJob.fromId<null, JobResult>(createPoolQueue, jobId)
					if (!job) throw new Error(`Job with ID ${jobId} not found`)
					push(job.returnvalue)
				})
				await stop
				listener.close()
			})
		},
		resolve: (transaction) => transaction
	})
)

builder.queryField("poolCreationJob", (t) =>
	t.field({
		type: JobResult,
		description: "Get the status of a pool creation job",
		args: { jobId: t.arg.string({ required: true }) },
		resolve: async (_, { jobId }, { queues: { createPoolQueue } }) => {
			const job = await bullmqJob.fromId<null, JobResult>(createPoolQueue, jobId)
			if (!job) throw new Error(`Job with ID ${jobId} not found`)
			console.log(job.toJSON())
			return job.returnvalue
		}
	})
)

builder.mutationField("confirmJob", (t) =>
	t.field({
		type: "String",
		description: "Confirm a job by ID",
		args: { jobId: t.arg.string({ required: true }) },
		resolve: async (_, { jobId }, { db }) => {
			const data = await db.select().from(pool).where(eq(pool.jobId, jobId))
			if (data.length === 0) throw new Error(`No pool found for job ID ${jobId}`)
			await db.update(pool).set({ status: "confirmed" }).where(eq(pool.jobId, jobId))
			return `Job ${jobId} confirmed`
		}
	})
)

builder.addScalarType("JSONObject", JSONObjectResolver)

builder.queryType()
builder.mutationType()
builder.subscriptionType()

export const schema: GraphQLSchemaWithContext<Context & YogaInitialContext> = builder.toSchema()
