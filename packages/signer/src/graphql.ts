import type { Networks } from "@lumina-dex/sdk"
import SchemaBuilder from "@pothos/core"
import { eq } from "drizzle-orm"
import { GraphQLError } from "graphql"
import { DateTimeResolver } from "graphql-scalars"
import { type GraphQLSchemaWithContext, Repeater, type YogaInitialContext } from "graphql-yoga"
import { factory, pool } from "../drizzle/schema"
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
	description: "A job representing a task",
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
		completedAt: t.field({ nullable: false, type: "Date", resolve: ({ completedAt }) => completedAt ?? new Date() })
	})
})

export interface FactoryJobResult {
	status: "pending" | "completed" | "failed"
	factoryPublicKey: string
	transactionJson: string
	completedAt: Date
}

const FactoryJobResult = builder.objectRef<FactoryJobResult>("FactoryJobResult").implement({
	description: "A factory deployment job result represented in JSON format",
	fields: (t) => ({
		status: t.exposeString("status", { nullable: false }),
		factoryPublicKey: t.exposeString("factoryPublicKey", { nullable: false }),
		transactionJson: t.exposeString("transactionJson", { nullable: false }),
		completedAt: t.field({ nullable: false, type: "Date", resolve: ({ completedAt }) => completedAt ?? new Date() })
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

export type DeployFactoryInputType = {
	deployer: string
	network: Networks
}

const DeployFactoryInput = builder.inputRef<DeployFactoryInputType>("DeployFactoryInput").implement({
	description: "Input type for deploying a factory",
	fields: (t) => ({
		deployer: t.string({ required: true }),
		network: t.field({ type: NetworkEnum, required: true })
	})
})

// Helper pour déterminer le type de job
const isFactoryJob = (data: CreatePoolInputType | DeployFactoryInputType): data is DeployFactoryInputType => {
	return "deployer" in data
}

// ==================== POOL MUTATIONS ====================

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
			logger.log(`Pool creation job ${id} added to queue`)
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
			logger.log(`Subscribing to pool creation job ${args.jobId}`)

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
				for await (const result of pubsub.subscribe(args.jobId)) {
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

// ==================== FACTORY MUTATIONS ====================

builder.mutationField("deployFactory", (t) =>
	t.field({
		type: Job,
		description: "Deploy a new factory",
		args: { input: t.arg({ type: DeployFactoryInput, required: true }) },
		resolve: async (_, { input }, { jobQueue }) => {
			using q = jobQueue()
			const id = globalThis.crypto.randomUUID()
			const job = q.getJob(id)
			if (job) return { id, status: job.status }
			q.addJob(id, input)
			logger.log(`Factory deployment job ${id} added to queue`)
			return { id, status: "created" }
		}
	})
)

builder.subscriptionField("factoryDeployment", (t) =>
	t.field({
		type: FactoryJobResult,
		description: "Subscribe to factory deployment events",
		args: { jobId: t.arg.string({ required: true }) },
		subscribe: async (_, args, { jobQueue, pubsub }) => {
			logger.log(`Subscribing to factory deployment job ${args.jobId}`)

			return new Repeater<FactoryJobResult>(async (push, stop) => {
				using q = jobQueue()
				const rfail = (message: string) => {
					logger.error(message)
					return stop(new GraphQLError(message))
				}
				const job = q.getJob(args.jobId)
				if (!job) return rfail(`Factory deployment job ${args.jobId} not found`)

				// Vérifier que c'est bien un job de factory
				if (!isFactoryJob(job.data)) {
					return rfail(`Job ${args.jobId} is not a factory deployment job`)
				}

				if (job.status === "failed") return rfail(`Factory deployment job ${args.jobId} failed`)
				if (job.status === "completed") {
					logger.log(`Factory deployment job ${args.jobId} already completed`)
					push(job as FactoryJobResult)
					return stop()
				}
				for await (const result of pubsub.subscribe(args.jobId)) {
					logger.log(`Factory deployment job ${args.jobId} event:`, result)
					if (result.status === "failed") return rfail(`Factory deployment job ${args.jobId} failed`)
					push(result as FactoryJobResult)
					return stop()
				}
				await stop
			})
		},
		resolve: (transaction) => transaction
	})
)

builder.queryField("factoryDeploymentJob", (t) =>
	t.field({
		type: FactoryJobResult,
		description: "Get the factory deployment job",
		args: { jobId: t.arg.string({ required: true }) },
		resolve: async (_, { jobId }, { jobQueue }) => {
			using q = jobQueue()
			const job = q.getJob(jobId)
			if (!job) return fail(`Factory deployment job ${jobId} not found`)

			// Vérifier que c'est bien un job de factory
			if (!isFactoryJob(job.data)) {
				return fail(`Job ${jobId} is not a factory deployment job`)
			}

			if (job.status === "failed") return fail(`Factory deployment job ${jobId} failed`)
			logger.log(`Factory deployment job ${jobId} found:`, job)
			return job as FactoryJobResult
		}
	})
)

// ==================== CONFIRM MUTATIONS ====================

builder.mutationField("confirmJob", (t) =>
	t.field({
		type: "String",
		description: "Confirm a pool job with a given jobId",
		args: { jobId: t.arg.string({ required: true }) },
		resolve: async (_, { jobId }, { database, jobQueue, shouldUpdateCDN }) => {
			using q = jobQueue()
			using db = database()
			const data = await db.drizzle.select().from(pool).where(eq(pool.jobId, jobId))
			if (data.length === 0) return fail(`No pool found for job ID ${jobId}`)
			const { network, publicKey: poolAddress } = data[0]

			if (data[0].status === "confirmed") {
				logger.log(`Job ${jobId} for pool ${poolAddress} is already confirmed`)
				return `Job for pool ${jobId} is already confirmed`
			}

			await db.drizzle.update(pool).set({ status: "confirmed" }).where(eq(pool.jobId, jobId))
			logger.log(`Job for pool ${jobId} confirmed in the database`)
			q.removeJob(jobId)
			logger.log(`Job ${jobId} removed from cache`)

			if (shouldUpdateCDN) {
				logger.log(`Updating CDN for pool ${poolAddress} on network ${network}`)
				const result = await updateStatusAndCDN({ poolAddress, network })
				return `Job for pool "${poolAddress}" confirmed and CDN updated: ${result}`
			}
			return `Job ${jobId} for pool "${poolAddress}" confirmed`
		}
	})
)

builder.mutationField("confirmFactoryJob", (t) =>
	t.field({
		type: "String",
		description: "Confirm a factory deployment job with a given jobId",
		args: { jobId: t.arg.string({ required: true }) },
		resolve: async (_, { jobId }, { database, jobQueue }) => {
			using q = jobQueue()
			using db = database()

			// Récupérer la factory via le jobId
			const data = await db.drizzle.select().from(factory).where(eq(factory.jobId, jobId))

			if (data.length === 0) return fail(`No factory found for job ID ${jobId}`)
			const { network, publicKey: factoryAddress } = data[0]

			logger.log(`Factory deployment job ${jobId} confirmed for factory ${factoryAddress}`)
			q.removeJob(jobId)
			logger.log(`Factory deployment job ${jobId} removed from cache`)

			return `Factory deployment job ${jobId} for factory "${factoryAddress}" on network ${network} confirmed`
		}
	})
)

builder.queryType()
builder.mutationType()
builder.subscriptionType()

export const schema: GraphQLSchemaWithContext<Context & YogaInitialContext> = builder.toSchema()
