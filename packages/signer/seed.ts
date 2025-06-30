import { drizzle } from "drizzle-orm/libsql"
import { signerMerkle } from "./src/db/schema"
import { eq } from "drizzle-orm"

const db = drizzle(process.env.DB_FILE_NAME!)

async function seed() {
	const entries = [
		{
			publicKey: "B62qjpbiYvHwbU5ARVbE5neMcuxfxg2zt8wHjkWVKHEiD1micG92CtJ",
			right: "deploy",
			active: true
		},
		{
			publicKey: "B62qic5sGvm6QvFzJ92588YgkKxzqi2kFeYydnkM8VDAvY9arDgY6m6",
			right: "all",
			active: true
		},
		{
			publicKey: "B62qkjzL662Z5QD16cB9j6Q5TH74y42ALsMhAiyrwWvWwWV1ypfcV65",
			right: "all",
			active: true
		},
		{
			publicKey: "B62qjabhmpW9yfLbvUz87BR1u462RRqFfXgoapz8X3Fw8uaXJqGG8WH",
			right: "all",
			active: true
		},
		{
			publicKey: "B62qpLxXFg4rmhce762uiJjNRnp5Bzc9PnCEAcraeaMkVWkPi7kgsWV",
			right: "all",
			active: true
		},
		{
			publicKey: "B62qrgWEGhgXQ5PnpEaeJqs1MRx4Jiw2aqSTfyxAsEVDJzqNFm9PEQt",
			right: "all",
			active: true
		},
		{
			publicKey: "B62qkfpRcsJjByghq8FNkzBh3wmzLYFWJP2qP9x8gJ48ekfd6MVXngy",
			right: "all",
			active: true
		},
		{
			publicKey: "B62qipa4xp6pQKqAm5qoviGoHyKaurHvLZiWf3djDNgrzdERm6AowSQ",
			right: "all",
			active: true
		}
	]

	for (const entry of entries) {
		const existing = db
			.select()
			.from(signerMerkle)
			.where(eq(signerMerkle.publicKey, entry.publicKey))
			.get()
		if (!existing) {
			await db.insert(signerMerkle).values(entry)
			console.log(`Inserted: ${entry.publicKey}`)
		} else {
			console.log(`Skipped (already exists): ${entry.publicKey}`)
		}
	}

	console.log("✅ Seed completed.")
}

seed().then()
