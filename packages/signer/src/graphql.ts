import type { Networks } from "@lumina-dex/sdk"
import SchemaBuilder from "@pothos/core"
import { eq } from "drizzle-orm"
import { GraphQLError } from "graphql"
import { JSONObjectResolver } from "graphql-scalars"
import { type GraphQLSchemaWithContext, Repeater, type YogaInitialContext } from "graphql-yoga"
import { hash } from "ohash"
import { pool } from "../drizzle/schema"
import type { Context } from "."

type Builder = {
	Context: Context
	Scalars: {
		JSONObject: {
			Input: string
			Output: string
		}
	}
}

const builder = new SchemaBuilder<Builder>({})

builder.addScalarType("JSONObject", JSONObjectResolver)

interface Job {
	id: string
}
const Job = builder.objectRef<Job>("Job").implement({
	description: "A job representing a pool creation task",
	fields: (t) => ({ id: t.exposeString("id") })
})

interface JobResult {
	poolPublicKey: string
	transactionJson: string
}
const JobResult = builder.objectRef<JobResult>("JobResult").implement({
	description: "A job result represented in JSON format",
	fields: (t) => ({
		poolPublicKey: t.field({ type: "String", resolve: (r) => r.poolPublicKey, nullable: false }),
		transactionJson: t.field({
			type: "JSONObject",
			nullable: false,
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
			console.log(`Job ID: ${jobId}, Exists: ${!!exists}`)
			if (!exists) {
				const job = await createPoolQueue.add("createPool", input, {
					jobId,
					removeOnFail: true,
					removeOnComplete: { age: 5 }
				})
				console.log(`Job created with ID: ${job.id}`)
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
			if (!job) throw new GraphQLError(`Job with ID ${args.jobId} not found`)
			return new Repeater<JobResult>(async (push, stop) => {
				if (await job.isCompleted()) {
					const result = job.returnvalue
					push(result)
					return stop()
				}
				const completed = createPoolQueueEvents.on("completed", async ({ jobId }) => {
					if (jobId !== args.jobId) return
					console.log(`${jobId} has completed.`)
					const job = await createPoolQueue.getJob(jobId)
					if (!job) return stop(new GraphQLError(`Job with ID ${jobId} not found`))
					push(job.returnvalue)
					return stop()
				})
				const failed = createPoolQueueEvents.on("failed", ({ jobId, failedReason }) => {
					if (jobId !== args.jobId) return
					console.error(`Job ${jobId} has failed with reason: ${failedReason}`)
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
		description: "Get the status of a pool creation job",
		args: { jobId: t.arg.string({ required: true }) },
		resolve: async (_, { jobId }, { queues: { createPoolQueue } }) => {
			const job = await createPoolQueue.getJob(jobId)
			if (!job) throw new GraphQLError(`Job with ID ${jobId} not found`)
			return job.returnvalue
		}
	})
)

builder.mutationField("confirmJob", (t) =>
	t.field({
		type: "String",
		description: "Confirm a job for a given pool",
		args: { poolPublicKey: t.arg.string({ required: true }) },
		resolve: async (_, { poolPublicKey }, { db }) => {
			const data = await db.select().from(pool).where(eq(pool.publicKey, poolPublicKey))
			if (data.length === 0) throw new GraphQLError(`No pool found for public key ${poolPublicKey}`)
			await db.update(pool).set({ status: "confirmed" }).where(eq(pool.publicKey, poolPublicKey))
			return `Job for pool ${poolPublicKey} confirmed`
		}
	})
)

builder.queryType()
builder.mutationType()
builder.subscriptionType()

export const schema: GraphQLSchemaWithContext<Context & YogaInitialContext> = builder.toSchema()
