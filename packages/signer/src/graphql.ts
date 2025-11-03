import type { Networks } from "@lumina-dex/sdk"
import SchemaBuilder from "@pothos/core"
import { and, eq } from "drizzle-orm"
import { GraphQLError } from "graphql"
import { DateTimeResolver } from "graphql-scalars"
import { type GraphQLSchemaWithContext, Repeater, type YogaInitialContext } from "graphql-yoga"
import { factory, multisig, pool, signerMerkle, signerMerkleNetworks } from "../drizzle/schema"
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

// ==================== ADMIN AUTH ====================

const checkAdminAuth = (context: Context) => {
	if (!context.isAdmin) {
		throw new GraphQLError("Unauthorized: Admin access required")
	}
}

// ==================== JOB TYPES ====================

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

// ==================== SIGNER TYPES ====================

type SignerMerkleType = typeof signerMerkle.$inferSelect
type SignerNetworkType = typeof signerMerkleNetworks.$inferSelect
type SignerWithNetworks = SignerMerkleType & {
	networks?: SignerNetworkType[]
}

const SignerNetwork = builder.objectRef<SignerNetworkType>("SignerNetwork").implement({
	description: "A signer's network configuration",
	fields: (t) => ({
		id: t.exposeInt("id"),
		signerId: t.exposeInt("signerId"),
		network: t.exposeString("network"),
		permission: t.exposeInt("permission"),
		active: t.exposeBoolean("active"),
		createdAt: t.field({
			type: "Date",
			resolve: (signerNetwork) => signerNetwork.createdAt
		})
	})
})

const Signer = builder.objectRef<SignerWithNetworks>("Signer").implement({
	description: "A signer in the merkle tree",
	fields: (t) => ({
		id: t.exposeInt("id"),
		publicKey: t.exposeString("publicKey"),
		createdAt: t.field({
			type: "Date",
			resolve: (signer) => signer.createdAt
		}),
		networks: t.field({
			type: [SignerNetwork],
			description: "Network configurations for this signer",
			nullable: true,
			resolve: (signer) => signer.networks || []
		})
	})
})

// ==================== NETWORK ENUM ====================

const NetworkType = {
	mina_mainnet: "mina:mainnet",
	mina_devnet: "mina:devnet",
	zeko_mainnet: "zeko:mainnet",
	zeko_testnet: "zeko:testnet"
} as const satisfies Record<string, Networks>

const NetworkEnum = builder.enumType("Network", {
	values: Object.fromEntries(Object.entries(NetworkType).map(([name, value]) => [name, { value }]))
})

// ==================== POOL/FACTORY INPUT TYPES ====================

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
	protocol: string
	delegator: string
	data: string
}

const DeployFactoryInput = builder.inputRef<DeployFactoryInputType>("DeployFactoryInput").implement({
	description: "Input type for deploying a factory",
	fields: (t) => ({
		deployer: t.string({ required: true }),
		network: t.field({ type: NetworkEnum, required: true }),
		protocol: t.string({ required: true }),
		delegator: t.string({ required: true }),
		data: t.string({ required: true })
	})
})

// ==================== SIGNER INPUT TYPES ====================

const CreateSignerInput = builder.inputType("CreateSignerInput", {
	fields: (t) => ({
		publicKey: t.string({ required: true })
	})
})

const UpdateSignerInput = builder.inputType("UpdateSignerInput", {
	fields: (t) => ({
		publicKey: t.string({ required: false })
	})
})

const CreateSignerNetworkInput = builder.inputType("CreateSignerNetworkInput", {
	fields: (t) => ({
		signerId: t.int({ required: true }),
		network: t.field({ type: NetworkEnum, required: true }),
		permission: t.int({ required: true }),
		active: t.boolean({ required: false })
	})
})

const UpdateSignerNetworkInput = builder.inputType("UpdateSignerNetworkInput", {
	fields: (t) => ({
		permission: t.int({ required: false }),
		active: t.boolean({ required: false })
	})
})

const isFactoryJob = (data: CreatePoolInputType | DeployFactoryInputType): data is DeployFactoryInputType => {
	return data && "deployer" in data
}

// ==================== SIGNER QUERIES ====================

builder.queryField("signers", (t) =>
	t.field({
		type: [Signer],
		description: "Get all signers with their network permissions (Admin only)",
		args: {
			network: t.arg({
				type: NetworkEnum,
				required: false,
				description: "Filter signers by network"
			})
		},
		resolve: async (_, { network }, context) => {
			checkAdminAuth(context)
			using db = context.database()

			const signersData = await db.drizzle
				.select({
					signer: signerMerkle,
					network: signerMerkleNetworks
				})
				.from(signerMerkle)
				.leftJoin(signerMerkleNetworks, eq(signerMerkle.id, signerMerkleNetworks.signerId))
				.where(network ? eq(signerMerkleNetworks.network, network) : undefined)

			const signersMap = new Map<number, SignerWithNetworks>()

			for (const row of signersData) {
				if (!signersMap.has(row.signer.id)) {
					signersMap.set(row.signer.id, {
						...row.signer,
						networks: []
					})
				}

				if (row.network) {
					signersMap.get(row.signer.id)!.networks?.push(row.network)
				}
			}

			const signers = Array.from(signersMap.values())
			logger.log(`Retrieved ${signers.length} signers${network ? ` for network ${network}` : ""} with their networks`)
			return signers
		}
	})
)

builder.queryField("signer", (t) =>
	t.field({
		type: Signer,
		description: "Get a signer by ID with their network permissions (Admin only)",
		args: {
			id: t.arg.int({ required: true })
		},
		resolve: async (_, { id }, context) => {
			checkAdminAuth(context)
			using db = context.database()

			// Récupérer le signer avec ses networks
			const signerData = await db.drizzle
				.select({
					signer: signerMerkle,
					network: signerMerkleNetworks
				})
				.from(signerMerkle)
				.leftJoin(signerMerkleNetworks, eq(signerMerkle.id, signerMerkleNetworks.signerId))
				.where(eq(signerMerkle.id, id))

			if (signerData.length === 0) {
				throw new GraphQLError(`Signer with ID ${id} not found`)
			}

			// Construire le signer avec tous ses networks
			const signer: SignerWithNetworks = {
				...signerData[0].signer,
				networks: signerData.filter((row) => row.network !== null).map((row) => row.network!)
			}

			logger.log(`Retrieved signer ${id} with ${signer.networks?.length} networks`)
			return signer
		}
	})
)

// ==================== SIGNER MUTATIONS ====================

builder.mutationField("createSigner", (t) =>
	t.field({
		type: Signer,
		description: "Create a new signer (Admin only)",
		args: {
			input: t.arg({ type: CreateSignerInput, required: true })
		},
		resolve: async (_, { input }, context) => {
			checkAdminAuth(context)
			using db = context.database()

			// Check if signer already exists
			const existing = await db.drizzle.select().from(signerMerkle).where(eq(signerMerkle.publicKey, input.publicKey))

			if (existing.length > 0) {
				throw new GraphQLError(`Signer with public key ${input.publicKey} already exists`)
			}

			const result = await db.drizzle.insert(signerMerkle).values(input).returning()
			logger.log(`Created signer ${result[0].id}`)
			return result[0]
		}
	})
)

builder.mutationField("updateSigner", (t) =>
	t.field({
		type: Signer,
		description: "Update a signer (Admin only)",
		args: {
			id: t.arg.int({ required: true }),
			input: t.arg({ type: UpdateSignerInput, required: true })
		},
		resolve: async (_, { id, input }, context) => {
			checkAdminAuth(context)
			using db = context.database()

			// Check if signer exists
			const existing = await db.drizzle.select().from(signerMerkle).where(eq(signerMerkle.id, id))
			if (!existing[0]) {
				throw new GraphQLError(`Signer with ID ${id} not found`)
			}

			const result = await db.drizzle.update(signerMerkle).set(input).where(eq(signerMerkle.id, id)).returning()
			logger.log(`Updated signer ${id}`)
			return result[0]
		}
	})
)

builder.mutationField("createSignerNetwork", (t) =>
	t.field({
		type: SignerNetwork,
		description: "Add a signer to a network (Admin only)",
		args: {
			input: t.arg({ type: CreateSignerNetworkInput, required: true })
		},
		resolve: async (_, { input }, context) => {
			checkAdminAuth(context)
			using db = context.database()

			// Check if signer exists
			const signerExists = await db.drizzle.select().from(signerMerkle).where(eq(signerMerkle.id, input.signerId))
			if (!signerExists[0]) {
				throw new GraphQLError(`Signer with ID ${input.signerId} not found`)
			}

			// Check if signer is already on this network
			const existing = await db.drizzle
				.select()
				.from(signerMerkleNetworks)
				.where(and(eq(signerMerkleNetworks.signerId, input.signerId), eq(signerMerkleNetworks.network, input.network)))

			if (existing.length > 0) {
				throw new GraphQLError(`Signer ${input.signerId} is already configured for network ${input.network}`)
			}

			const result = await db.drizzle
				.insert(signerMerkleNetworks)
				.values({
					...input,
					active: input.active ?? true
				})
				.returning()

			const signer = signerExists[0]
			logger.log(`Added signer ${input.signerId} to network ${input.network}`)
			return { ...result[0], signer }
		}
	})
)

builder.mutationField("updateSignerNetwork", (t) =>
	t.field({
		type: SignerNetwork,
		description: "Update a signer's network configuration (Admin only)",
		args: {
			signerId: t.arg.int({ required: true }),
			network: t.arg({ type: NetworkEnum, required: true }),
			input: t.arg({ type: UpdateSignerNetworkInput, required: true })
		},
		resolve: async (_, { signerId, network, input }, context) => {
			checkAdminAuth(context)
			using db = context.database()

			// Check if configuration exists
			const existing = await db.drizzle
				.select()
				.from(signerMerkleNetworks)
				.where(and(eq(signerMerkleNetworks.signerId, signerId), eq(signerMerkleNetworks.network, network)))

			if (!existing[0]) {
				throw new GraphQLError(`Signer ${signerId} configuration not found for network ${network}`)
			}

			const result = await db.drizzle
				.update(signerMerkleNetworks)
				.set(input)
				.where(and(eq(signerMerkleNetworks.signerId, signerId), eq(signerMerkleNetworks.network, network)))
				.returning()

			const signer = await db.drizzle.select().from(signerMerkle).where(eq(signerMerkle.id, signerId))

			logger.log(`Updated signer ${signerId} configuration for network ${network}`)
			return { ...result[0], signer: signer[0] }
		}
	})
)

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

// ==================== MULTISIG TYPES ====================

type MultisigType = typeof multisig.$inferSelect

const Multisig = builder.objectRef<MultisigType & { signer?: SignerMerkleType }>("Multisig").implement({
	description: "A multisig transaction",
	fields: (t) => ({
		id: t.exposeInt("id"),
		signerId: t.exposeInt("signerId"),
		signature: t.exposeString("signature"),
		data: t.exposeString("data"),
		network: t.exposeString("network"),
		deadline: t.exposeInt("deadline"),
		createdAt: t.field({
			type: "Date",
			resolve: (multisig) => multisig.createdAt
		}),
		signer: t.field({
			type: Signer,
			nullable: true,
			resolve: (multisig) => multisig.signer
		})
	})
})

// ==================== MULTISIG INPUT TYPES ====================

const CreateMultisigInput = builder.inputType("CreateMultisigInput", {
	fields: (t) => ({
		signerId: t.int({ required: true }),
		signature: t.string({ required: true }),
		data: t.string({ required: true }),
		network: t.field({ type: NetworkEnum, required: true }),
		deadline: t.int({ required: true })
	})
})

// ==================== MULTISIG QUERIES ====================

builder.queryField("multisigs", (t) =>
	t.field({
		type: [Multisig],
		description: "Get all multisigs with optional network filter (Admin only)",
		args: {
			network: t.arg({
				type: NetworkEnum,
				required: false,
				description: "Filter multisigs by network"
			})
		},
		resolve: async (_, { network }, context) => {
			checkAdminAuth(context)
			using db = context.database()

			// Construire la requête de base avec jointure sur signer
			const baseQuery = db.drizzle
				.select({
					multisig: multisig,
					signer: signerMerkle
				})
				.from(multisig)
				.leftJoin(signerMerkle, eq(multisig.signerId, signerMerkle.id))

			const multisigData = network ? await baseQuery.where(eq(multisig.network, network)) : await baseQuery

			const multisigs = multisigData.map((row) => ({
				...row.multisig,
				signer: row.signer ?? undefined
			}))

			logger.log(`Retrieved ${multisigs.length} multisigs${network ? ` for network ${network}` : ""}`)
			return multisigs
		}
	})
)

builder.queryField("multisig", (t) =>
	t.field({
		type: Multisig,
		description: "Get a multisig by ID (Admin only)",
		args: {
			id: t.arg.int({ required: true })
		},
		resolve: async (_, { id }, context) => {
			checkAdminAuth(context)
			using db = context.database()

			const multisigData = await db.drizzle
				.select({
					multisig: multisig,
					signer: signerMerkle
				})
				.from(multisig)
				.leftJoin(signerMerkle, eq(multisig.signerId, signerMerkle.id))
				.where(eq(multisig.id, id))

			if (multisigData.length === 0) {
				throw new GraphQLError(`Multisig with ID ${id} not found`)
			}

			const result = {
				...multisigData[0].multisig,
				signer: multisigData[0].signer ?? undefined
			}

			logger.log(`Retrieved multisig ${id}`)
			return result
		}
	})
)

// ==================== MULTISIG MUTATIONS ====================

builder.mutationField("createMultisig", (t) =>
	t.field({
		type: Multisig,
		description: "Create a new multisig transaction (Admin only)",
		args: {
			input: t.arg({ type: CreateMultisigInput, required: true })
		},
		resolve: async (_, { input }, context) => {
			checkAdminAuth(context)
			using db = context.database()

			// Vérifier que le signer existe
			const signerExists = await db.drizzle.select().from(signerMerkle).where(eq(signerMerkle.id, input.signerId))

			if (signerExists.length === 0) {
				throw new GraphQLError(`Signer with ID ${input.signerId} not found`)
			}

			// Vérifier que le network existe
			const networkExists = await db.drizzle
				.select()
				.from(signerMerkleNetworks)
				.where(eq(signerMerkleNetworks.network, input.network))

			if (networkExists.length === 0) {
				throw new GraphQLError(`Network ${input.network} not found`)
			}

			// Créer le multisig
			const result = await db.drizzle
				.insert(multisig)
				.values({
					signerId: input.signerId,
					signature: input.signature,
					data: input.data,
					network: input.network,
					deadline: input.deadline
				})
				.returning()

			logger.log(`Created multisig ${result[0].id}`)

			// Retourner avec le signer
			return {
				...result[0],
				signer: signerExists[0]
			}
		}
	})
)

builder.queryType()
builder.mutationType()
builder.subscriptionType()

export const schema: GraphQLSchemaWithContext<Context & YogaInitialContext> = builder.toSchema()
