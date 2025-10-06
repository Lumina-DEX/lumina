import { DurableObject } from "cloudflare:workers"
import { and, count, eq, or, sql } from "drizzle-orm"
import { type DrizzleSqliteDODatabase, drizzle } from "drizzle-orm/durable-sqlite"
import { migrate } from "drizzle-orm/durable-sqlite/migrator"
import migrations from "../drizzle/generated/migrations"
import * as schema from "../drizzle/schema"
import {
	type Exists,
	type FindPoolBy,
	type FindTokenBy,
	formatPoolWithTokensResults,
	type Network,
	type Pool,
	pools,
	type Token,
	tokens
} from "./helper"

//https://github.com/drizzle-team/drizzle-orm/issues/2479
const BATCH_SIZE = 10

export class TokenList extends DurableObject {
	storage: DurableObjectStorage
	db: DrizzleSqliteDODatabase<typeof schema>

	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env)
		this.storage = ctx.storage
		this.db = drizzle(this.storage, { schema, logger: false })

		if (env.ENVIRONMENT === "local") {
			migrate(this.db, migrations)
			this.seed()
		} else {
			ctx.blockConcurrencyWhile(async () => {
				await this._migrate()
			})
		}
	}

	/**
	 * Insert
	 * -------------------------------------
	 */
	async insertTokenIfExists({ network, address, token }: Exists & { token: Token | Token[] }) {
		const exists = await this.tokenExists({ network, address })
		if (!exists) return this.insertToken(token)
		return false
	}

	async insertPoolIfExists({ network, address, pool }: Exists & { pool: Pool | Pool[] }) {
		const exists = await this.poolExists({ network, address })
		if (!exists) return this.insertPool(pool)
		return false
	}

	async insertToken(token: Token | Token[]) {
		const toInsert = Array.isArray(token) ? token : [token]
		return this.db.transaction(() => {
			const allReturned = []
			for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
				const batch = toInsert.slice(i, i + BATCH_SIZE)
				const returned = this.db.insert(tokens).values(batch).onConflictDoNothing().returning().all()
				allReturned.push(...returned)
			}
			return allReturned
		})
	}

	async insertPool(pool: Pool | Pool[]) {
		const toInsert = Array.isArray(pool) ? pool : [pool]
		return this.db.transaction(() => {
			const allReturned = []
			for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
				const batch = toInsert.slice(i, i + BATCH_SIZE)
				const returned = this.db.insert(pools).values(batch).onConflictDoNothing().returning().all()
				allReturned.push(...returned)
			}
			return allReturned
		})
	}

	/**
	 * Find
	 * -------------------------------------
	 */

	async findTokenBy({ network, by, value }: FindTokenBy) {
		return this.db
			.select()
			.from(tokens)
			.where(and(eq(tokens[by], value), eq(tokens.chainId, network)))
			.all()
	}

	async findPoolBy({ network, by, value }: FindPoolBy) {
		const condition = {
			tokenAddress: or(eq(pools.token0Address, value), eq(pools.token1Address, value)),
			address: eq(pools.address, value)
		}[by]
		const result = this.db
			.select()
			.from(pools)
			.leftJoin(
				tokens,
				or(
					and(eq(pools.token0Address, tokens.address), eq(pools.chainId, tokens.chainId)),
					and(eq(pools.token1Address, tokens.address), eq(pools.chainId, tokens.chainId))
				)
			)
			.where(and(condition, eq(pools.chainId, network)))
			.all()

		return formatPoolWithTokensResults(result)
	}

	/**
	 * Exist
	 * -------------------------------------
	 */

	async tokenExists({ network, address }: Exists) {
		const result = this.db
			.select({ count: sql<number>`count(*)` })
			.from(tokens)
			.where(and(eq(tokens.address, address), eq(tokens.chainId, network)))
			.all()
		return result[0].count > 0
	}

	async poolExists({ network, address }: Exists) {
		const result = this.db
			.select({ count: sql<number>`count(*)` })
			.from(pools)
			.where(and(eq(pools.address, address), eq(pools.chainId, network)))
			.all()
		return result[0].count > 0
	}

	/**
	 * Find All
	 * -------------------------------------
	 */

	async findAllTokens({ network }: Network) {
		return this.db.select().from(tokens).where(eq(tokens.chainId, network)).all()
	}

	async findAllPools({ network }: Network) {
		const result = this.db
			.select()
			.from(pools)
			.leftJoin(
				tokens,
				or(
					and(eq(pools.token0Address, tokens.address), eq(pools.chainId, tokens.chainId)),
					and(eq(pools.token1Address, tokens.address), eq(pools.chainId, tokens.chainId))
				)
			)
			.where(eq(pools.chainId, network))
			.all()

		return formatPoolWithTokensResults(result)
	}

	/**
	 * Count
	 * -------------------------------------
	 */

	async countTokens({ network }: Network) {
		const result = this.db.select({ count: count() }).from(tokens).where(eq(tokens.chainId, network)).all()
		return result[0].count
	}

	async countPools({ network }: Network) {
		const result = this.db.select({ count: count() }).from(pools).where(eq(pools.chainId, network)).all()
		return result[0].count
	}

	async reset({ network }: Network) {
		return {
			tokens: this.db.delete(tokens).where(eq(tokens.chainId, network)).returning().all(),
			pools: this.db.delete(pools).where(eq(pools.chainId, network)).returning().all()
		}
	}

	async _migrate() {
		migrate(this.db, migrations)
	}

	async seed() {
		// This is only used for local development and tests like in api.spec.ts
		this.insertToken([
			{
				address: "MINA",
				tokenId: "MINA",
				symbol: "MINA",
				chainId: "mina:devnet",
				decimals: 9
			},
			{
				address: "B62qjDaZ2wDLkFpt7a7eJme6SAJDuc3R3A2j2DRw7VMmJAFahut7e8w",
				tokenId: "wTRtTRnW7hZCQSVgsuMVJRvnS1xEAbRRMWyaaJPkQsntSNh67n",
				symbol: "TOKA",
				chainId: "mina:devnet",
				decimals: 9
			}
		])
		this.insertPool([
			{
				address: "pool_test_address",
				token0Address: "MINA",
				token1Address: "B62qjDaZ2wDLkFpt7a7eJme6SAJDuc3R3A2j2DRw7VMmJAFahut7e8w",
				chainId: "mina:devnet",
				name: "LLP-MINA_TOKA",
				tokenId: "pool_test_token_id"
			}
		])
	}
}
