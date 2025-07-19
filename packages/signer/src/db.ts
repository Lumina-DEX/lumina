import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import { relations } from "../drizzle/relations"

export const getDb = () => {
	try {
		// /!\ Use prepare:false if using a transaction pool mode
		const client = postgres(
			process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/signer",
			{ prepare: true }
		)

		const db = drizzle(client, { relations })

		return { client, db }
	} catch (error) {
		console.error("Error connecting to the database:", error)
		throw error
	}
}
