import { sql } from "drizzle-orm"
import {
	boolean,
	integer,
	pgTable,
	serial,
	text,
	timestamp,
	uniqueIndex
} from "drizzle-orm/pg-core"

// Table: SignerMerkle
export const signerMerkle = pgTable(
	"SignerMerkle",
	{
		id: serial("id").primaryKey(),
		createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
		publicKey: text("public_key").notNull()
	},
	(table) => [uniqueIndex("SignerMerkle_public_key_unique").on(table.publicKey)]
)

// Table: Networks
export const dbNetworks = pgTable("Network", {
	network: text("network", {
		enum: ["mina:mainnet", "mina:devnet", "zeko:testnet", "zeko:mainnet"] as const
	}).primaryKey(),
	createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`)
})

// Table: Multisig
export const multisig = pgTable("Multisig", {
	id: serial("id").primaryKey(),
	createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
	signerId: integer("signer")
		.notNull()
		.references(() => signerMerkle.id),
	signature: text("signature").notNull(),
	data: text("data").notNull(),
	network: text("network")
		.notNull()
		.references(() => dbNetworks.network),
	deadline: integer("deadline").notNull()
})

// Table: Pool
export const pool = pgTable(
	"Pool",
	{
		id: serial("id").primaryKey(),
		createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
		tokenA: text("token_a").notNull(),
		tokenB: text("token_b").notNull(),
		publicKey: text("public_key").notNull(),
		user: text("user").notNull(),
		jobId: text("job_id").notNull(),
		status: text("status", {
			enum: ["pending", "confirmed", "deployed"] as const
		}).notNull(),
		network: text("network")
			.notNull()
			.references(() => dbNetworks.network)
	},
	(table) => [
		uniqueIndex("Pool_job_id_unique").on(table.jobId),
		uniqueIndex("Pool_public_key_unique").on(table.publicKey)
	]
)

// Table: Factory, factory contract deployed on mainnet
export const factory = pgTable("Factory", {
	id: serial("id").primaryKey(),
	createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),

	publicKey: text("public_key").notNull(),
	user: text("user").notNull(),
	network: text("network")
		.notNull()
		.references(() => dbNetworks.network)
})

// Table: PoolKey
export const poolKey = pgTable("PoolKey", {
	id: serial("id").primaryKey(),
	createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
	poolId: integer("pool_id").references(() => pool.id, { onDelete: "cascade" }),
	factoryId: integer("factory_id").references(() => factory.id, { onDelete: "cascade" }),
	signer1Id: integer("signer_1")
		.notNull()
		.references(() => signerMerkle.id),
	signer2Id: integer("signer_2")
		.notNull()
		.references(() => signerMerkle.id),
	encryptedKey: text("encrypted_key").notNull(),
	generatedPublic1: text("generated_public_1").notNull(),
	generatedPublic2: text("generated_public_2").notNull()
})

// Table: SignerMerkleNetworks
export const signerMerkleNetworks = pgTable("SignerMerkleNetwork", {
	id: serial("id").primaryKey(),
	createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),

	signerId: integer("signer_id")
		.notNull()
		.references(() => signerMerkle.id, { onDelete: "cascade" }),

	network: text("network")
		.notNull()
		.references(() => dbNetworks.network),

	permission: integer("permission").notNull(),

	active: boolean("active").notNull().default(true)
})
