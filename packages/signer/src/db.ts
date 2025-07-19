import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import { relations } from "../drizzle/relations"

const connectionString =
	process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/signer"

// /!\ Use prepare:false if using a transaction pool mode
export const client = postgres(connectionString, { prepare: true })
export const db = drizzle(client, { relations })
