import { DurableObject } from "cloudflare:workers"
import type { Networks } from "@lumina-dex/sdk"
import { and, eq, sql } from "drizzle-orm"
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
		migrate(this.db, migrations)
		this.seed()
	}

	insertToken(network: Networks, token: Token | Token[]) {
		const table = getTable(network)
		const toInsert = Array.isArray(token) ? token : [token]
		const { sql, params } = this.db.insert(table).values(toInsert).onConflictDoNothing().toSQL()
		this.storage.sql.exec(sql, ...params)
	}

	findTokenBy({ network, by, value }: FindTokenBy) {
		const table = getTable(network)
		return this.db.select().from(table).where(eq(table[by], value)).all()
	}

	tokenExists({ network, address, poolAddress }: TokenExists) {
		const table = getTable(network)
		const result = this.db
			.select({ count: sql<number>`count(*)` })
			.from(table)
			.where(and(eq(table.address, address), eq(table.poolAddress, poolAddress)))
			.all()
		return result[0].count > 0
	}

	findAllTokens({ network }: Network) {
		const table = getTable(network)
		return this.db.select().from(table).all()
	}

	seed() {
		this.insertToken("mina:testnet", [
			{
				address: "B62qqKNnNRpCtgcBexw5khZSpk9K2d9Z7Wzcyir3WZcVd15Bz8eShVi",
				poolAddress: "B62qkrzCSQXVgjaWBc2evMGne2KMnx62MYFXdtQGKVc9G8eBQ1KYhk1",
				tokenId: "yBtcFk2EJTBJh7Ubjbw7oeAmiPjSTNKbtSVHd1f7voV39HQaWK",
				symbol: "WETH",
				decimals: 9
			},
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
