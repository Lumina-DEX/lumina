import { eq } from "drizzle-orm"
import { signerMerkle } from "../drizzle/schema"
import { getDb } from "../src/db"

const { db } = getDb()

async function seed() {
	const signers = [
		{
			publicKey: "B62qjpbiYvHwbU5ARVbE5neMcuxfxg2zt8wHjkWVKHEiD1micG92CtJ",
			permission: "deploy",
			active: true
		},
		{
			publicKey: "B62qic5sGvm6QvFzJ92588YgkKxzqi2kFeYydnkM8VDAvY9arDgY6m6",
			permission: "all",
			active: true
		},
		{
			publicKey: "B62qkjzL662Z5QD16cB9j6Q5TH74y42ALsMhAiyrwWvWwWV1ypfcV65",
			permission: "all",
			active: true
		},
		{
			publicKey: "B62qjabhmpW9yfLbvUz87BR1u462RRqFfXgoapz8X3Fw8uaXJqGG8WH",
			permission: "all",
			active: true
		},
		{
			publicKey: "B62qpLxXFg4rmhce762uiJjNRnp5Bzc9PnCEAcraeaMkVWkPi7kgsWV",
			permission: "all",
			active: true
		},
		{
			publicKey: "B62qrgWEGhgXQ5PnpEaeJqs1MRx4Jiw2aqSTfyxAsEVDJzqNFm9PEQt",
			permission: "all",
			active: true
		},
		{
			publicKey: "B62qkfpRcsJjByghq8FNkzBh3wmzLYFWJP2qP9x8gJ48ekfd6MVXngy",
			permission: "all",
			active: true
		},
		{
			publicKey: "B62qipa4xp6pQKqAm5qoviGoHyKaurHvLZiWf3djDNgrzdERm6AowSQ",
			permission: "all",
			active: true
		}
	] as const

	for (const entry of signers) {
		const existing = await db
			.select()
			.from(signerMerkle)
			.where(eq(signerMerkle.publicKey, entry.publicKey))
			.limit(1)
		if (existing.length === 0) {
			await db.insert(signerMerkle).values(entry)
			console.log(`Inserted: ${entry.publicKey}`)
		} else {
			console.log(`Skipped (already exists): ${entry.publicKey}`)
		}
	}
	console.log("✅ Seed completed.")
}

seed().then(() => {
	db.$client.end()
})
