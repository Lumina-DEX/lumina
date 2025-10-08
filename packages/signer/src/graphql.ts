import type { Networks } from "@lumina-dex/sdk"
import SchemaBuilder from "@pothos/core"
import { eq } from "drizzle-orm"
import { GraphQLError } from "graphql"
import { DateTimeResolver } from "graphql-scalars"
import { type GraphQLSchemaWithContext, Repeater, type YogaInitialContext } from "graphql-yoga"
import { pool } from "../drizzle/schema"
import type { Context } from "."
import { updateStatusAndCDN } from "./helpers/job"
import { logger } from "./helpers/utils"

type Builder = {
	Scalars: {
		Date: {
			Input: Date
			Output: Date
		}
	}
	Context: Context
}

const builder = new SchemaBuilder<Builder>({})
builder.addScalarType("Date", DateTimeResolver)

const fail = (message: string) => {
	logger.error(message)
	throw new GraphQLError(message)
}

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

export interface JobResult {
	status: "pending" | "completed" | "failed"
	poolPublicKey: string
	transactionJson: string
	completedAt: Date
}

const JobResult = builder.objectRef<JobResult>("JobResult").implement({
	description: "A job result represented in JSON format",
	fields: (t) => ({
		status: t.exposeString("status", { nullable: false }),
		poolPublicKey: t.exposeString("poolPublicKey", { nullable: false }),
		transactionJson: t.exposeString("transactionJson", { nullable: false }),
		completedAt: t.field({ nullable: false, type: "Date", resolve: () => new Date() })
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
		resolve: async (_, { input }, { jobQueue }) => {
			using q = jobQueue()
			const id = globalThis.crypto.randomUUID()

			const job = q.getJob(id)
			if (job) return { id, status: job.status }

			q.addJob(id, input)
			logger.log(`Job ${id} added to queue`)

			return { id, status: "created" }
		}
	})
)

builder.subscriptionField("poolCreation", (t) =>
	t.field({
		type: JobResult,
		description: "Subscribe to pool creation events",
		args: { jobId: t.arg.string({ required: true }) },
		subscribe: async (_, args, { jobQueue, pubsub }) => {
			logger.log(`Subscribing to job ${args.jobId}`)

			return new Repeater<JobResult>(async (push, stop) => {
				using q = jobQueue()

				const rfail = (message: string) => {
					logger.error(message)
					return stop(new GraphQLError(message))
				}
				const job = q.getJob(args.jobId)
				if (!job) return rfail(`Job ${args.jobId} not found`)
				if (job.status === "failed") return rfail(`Job ${args.jobId} failed : ${job.poolPublicKey}`)
				if (job.status === "completed") {
					logger.log(`Job ${args.jobId} already completed`)
					push(job)
					return stop()
				}

				const subscription = pubsub.subscribe(args.jobId)
				for await (const result of subscription) {
					logger.log(`Job ${args.jobId} event:`, result)

					if (result.status === "failed") return rfail(`Job ${args.jobId} failed: ${result.poolPublicKey}`)

					push(result)
					return stop()
				}

				await stop
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
		resolve: async (_, { jobId }, { jobQueue }) => {
			using q = jobQueue()

			const job = q.getJob(jobId)
			if (!job) return fail(`Job ${jobId} not found`)
			if (job.status === "failed") return fail(`Job ${jobId} failed: ${job.poolPublicKey}`)
			logger.log(`Job ${jobId} found:`, job)
			return job
		}
	})
)

builder.mutationField("confirmJob", (t) =>
	t.field({
		type: "String",
		description: "Confirm a job with a given jobId",
		args: { jobId: t.arg.string({ required: true }) },
		resolve: async (_, { jobId }, { database, jobQueue, shouldUpdateCDN }) => {
			using q = jobQueue()
			using db = database()

			const data = await db.drizzle.select().from(pool).where(eq(pool.jobId, jobId))
			if (data.length === 0) return fail(`No pool found for job ID ${jobId}`)

			if (data[0].status === "confirmed") {
				logger.log(`Job for pool ${jobId} is already confirmed`)
				return `Job for pool ${jobId} is already confirmed`
			}
			await db.drizzle.update(pool).set({ status: "confirmed" }).where(eq(pool.jobId, jobId))
			logger.log(`Job for pool ${jobId} confirmed in the database`)
			const { network, publicKey: poolAddress } = data[0]

			q.removeJob(jobId)
			logger.log(`Job ${jobId} removed from cache`)

			if (shouldUpdateCDN) {
				logger.log(`Updating CDN for pool ${poolAddress} on network ${network}`)
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
