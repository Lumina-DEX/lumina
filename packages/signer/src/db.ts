import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import { relations } from "../drizzle/relations"

export const getDb = () => {
	try {
		// /!\ Use prepare:false if using a transaction pool mode
		console.log("Initializing database connection...")
		const client = postgres(
			process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/signer",
			{ prepare: false }
		)
		const db = drizzle(client, { relations })
		return {
			drizzle: db,
			client,
			[Symbol.dispose]() {
				console.log("Closing database connection...")
				client.end()
			}
		}
	} catch (error) {
		console.error("Error connecting to the database:", error)
		throw error
	}
}
