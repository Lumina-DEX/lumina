import { DurableObject } from "cloudflare:workers"
import type { Networks } from "@lumina-dex/sdk"
import { and, count, eq, sql } from "drizzle-orm"
import { type DrizzleSqliteDODatabase, drizzle } from "drizzle-orm/durable-sqlite"
import { migrate } from "drizzle-orm/durable-sqlite/migrator"
import migrations from "../drizzle/generated/migrations"
import type { Env } from "../worker-configuration"
import { type FindTokenBy, type Network, type Token, type TokenExists, getTable } from "./helper"

export class TokenList extends DurableObject {
	storage: DurableObjectStorage
	db: DrizzleSqliteDODatabase

	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env)
		this.storage = ctx.storage
		this.db = drizzle(this.storage)

		if (env.ENVIRONMENT === "local") {
			migrate(this.db, migrations)
			this.seed()
		} else {
			ctx.blockConcurrencyWhile(async () => {
				await this._migrate()
			})
		}
	}

	async insertTokenIfExists({
		network,
		address,
		poolAddress,
		token
	}: TokenExists & { token: Token | Token[] }) {
		const exists = await this.tokenExists({ network, address, poolAddress })
		if (!exists) return this.insertToken(network, token)
		return false
	}

	async insertToken(network: Networks, token: Token | Token[]) {
		const table = getTable(network)
		const toInsert = Array.isArray(token) ? token : [token]
		return this.db.insert(table).values(toInsert).onConflictDoNothing().returning().all()
	}

	async findTokenBy({ network, by, value }: FindTokenBy) {
		const table = getTable(network)
		return this.db.select().from(table).where(eq(table[by], value)).all()
	}

	async tokenExists({ network, address, poolAddress }: TokenExists) {
		const table = getTable(network)
		const result = this.db
			.select({ count: sql<number>`count(*)` })
			.from(table)
			.where(and(eq(table.address, address), eq(table.poolAddress, poolAddress)))
			.all()
		return result[0].count > 0
	}

	async findAllTokens({ network }: Network) {
		const table = getTable(network)
		return this.db.select().from(table).all()
	}

	async count({ network }: Network) {
		const table = getTable(network)
		const result = this.db.select({ count: count() }).from(table).all()
		return result[0].count
	}

	async reset({ network }: Network) {
		const table = getTable(network)
		const result = this.db.delete(table).returning().all()
		return result
	}

	async _migrate() {
		migrate(this.db, migrations)
	}

	async seed() {
		//This is only used for local development and tests
		this.insertToken("mina:devnet", [
			{
				address: "B62qjDaZ2wDLkFpt7a7eJme6SAJDuc3R3A2j2DRw7VMmJAFahut7e8w",
				poolAddress: "B62qjGnANmDdJoBhWCQpbN2v3V4CBb5u1VJSCqCVZbpS5uDs7aZ7TCH",
				tokenId: "wTRtTRnW7hZCQSVgsuMVJRvnS1xEAbRRMWyaaJPkQsntSNh67n",
				symbol: "TOKA",
				decimals: 9
			}
		])
	}
}
