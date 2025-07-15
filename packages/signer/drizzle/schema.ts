import { sql } from "drizzle-orm"
import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core"

// Table: SignerMerkle
export const signerMerkle = sqliteTable(
	"SignerMerkle",
	{
		id: integer("id").primaryKey({ autoIncrement: true }),
		createdAt: integer("created_at", { mode: "timestamp" })
			.notNull()
			.default(sql`(current_timestamp)`),
		publicKey: text("public_key").notNull(),
		permission: text("permission", {
			enum: ["deploy", "all"] as const
		}).notNull(),
		active: integer("active", { mode: "boolean" }).notNull().default(true)
	},
	(table) => [uniqueIndex("SignerMerkle_public_key_unique").on(table.publicKey)]
)

// Table: Multisig
export const multisig = sqliteTable("Multisig", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	createdAt: integer("created_at", { mode: "timestamp" })
		.notNull()
		.default(sql`(current_timestamp)`),
	signerId: integer("signer")
		.notNull()
		.references(() => signerMerkle.id),
	signature: text("signature").notNull(),
	data: text("data").notNull(),
	deadline: integer("deadline").notNull()
})

// Table: Pool
export const pool = sqliteTable(
	"Pool",
	{
		id: integer("id").primaryKey({ autoIncrement: true }),
		createdAt: integer("created_at", { mode: "timestamp" })
			.notNull()
			.default(sql`(current_timestamp)`),
		tokenA: text("token_a").notNull(),
		tokenB: text("token_b").notNull(),
		publicKey: text("public_key").notNull(),
		user: text("user").notNull(),
		jobId: text("job_id").notNull(),
		status: text("status", {
			enum: ["pending", "confirmed", "deployed"] as const
		}).notNull(),
		network: text("network", {
			enum: ["mina:mainnet", "mina:devnet", "zeko:testnet", "zeko:mainnet"] as const
		}).notNull()
	},
	(table) => [
		uniqueIndex("Pool_job_id_unique").on(table.jobId),
		uniqueIndex("Pool_public_key_unique").on(table.publicKey)
	]
)

// Table: PoolKey
export const poolKey = sqliteTable("PoolKey", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	createdAt: integer("created_at", { mode: "timestamp" })
		.notNull()
		.default(sql`(current_timestamp)`),
	poolId: integer("public_key")
		.notNull()
		.references(() => pool.id, { onDelete: "cascade" }),
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
