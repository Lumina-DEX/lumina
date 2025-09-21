/** biome-ignore-all lint/style/noUnusedTemplateLiteral: SQL */

import { getDb } from "@/db"
import readline from "node:readline" // Import the readline module

const client = getDb().client

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
})

const askConfirmation = (query: string) => {
	return new Promise((resolve) => {
		rl.question(`${query} (yes/no): `, (answer) => {
			rl.close()
			resolve(answer.toLowerCase() === "yes" || answer.toLowerCase() === "y")
		})
	})
}

const main = async () => {
	// Prompt the user for confirmation
	const confirmed = await askConfirmation(
		"Are you absolutely sure you want to clear the database? This action is irreversible."
	)

	if (!confirmed) {
		console.log("Database clearing cancelled by user.")
		await client.end()
		return // Exit if not confirmed
	}
	try {
		// These can be used to reset the database on supabase.
		// /!\ CAREFUL WITH THIS. NEVER USE WITH PROD CONNECTION STRING /!\

		await client.unsafe(/*SQL*/ `DROP SCHEMA IF EXISTS public CASCADE`)
		await client.unsafe(/*SQL*/ `DROP SCHEMA IF EXISTS drizzle CASCADE`)
		await client.unsafe(/*SQL*/ `CREATE SCHEMA public`)

		console.log("Successfully cleared the database.")
	} catch (error) {
		console.error("Error clearing the database:", error)
	} finally {
		await client.end()
	}
}

main()
