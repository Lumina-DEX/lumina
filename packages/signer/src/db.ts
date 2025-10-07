import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import { relations } from "../drizzle/relations"
import { logger } from "./helpers/utils"

export const getDb = () => {
	try {
		// /!\ Use prepare:false if using a transaction pool mode
		logger.log("Initializing database connection...")
		const client = postgres(process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/signer", {
			prepare: false
		})
		const db = drizzle(client, { relations })
		return {
			drizzle: db,
			client,
			[Symbol.dispose]() {
				logger.log("Closing database connection...")
				client.end()
			}
		}
	} catch (error) {
		logger.error("Error connecting to the database:", error)
		throw error
	}
}
