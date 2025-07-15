import { eq } from "drizzle-orm"
import { drizzle } from "drizzle-orm/libsql"
import { relations } from "../drizzle/relations"
import { signerMerkle } from "../drizzle/schema"

const db = drizzle("file:local.db", { relations }) //Hardcode so that it runs only in dev.

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
			.get()
		if (!existing) {
			await db.insert(signerMerkle).values(entry)
			console.log(`Inserted: ${entry.publicKey}`)
		} else {
			console.log(`Skipped (already exists): ${entry.publicKey}`)
		}
	}

	// await db
	// 	.insert(pool)
	// 	.values({
	// 		tokenA: "MINA",
	// 		tokenB: "B62qqbQt3E4re5VLpgsQnhDj4R4bYvhXLds1dK9nRiUBRF9wweFxadW",
	// 		user: "B62qkjzL662Z5QD16cB9j6Q5TH74y42ALsMhAiyrwWvWwWV1ypfcV65",
	// 		publicKey: PrivateKey.random().toPublicKey().toBase58(),
	// 		jobId: "job-12345",
	// 		network: "mina:devnet",
	// 		status: "deployed"
	// 	})
	// 	.returning()

	console.log("✅ Seed completed.")
}

seed()
