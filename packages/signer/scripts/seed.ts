import { eq } from "drizzle-orm"
import { signerMerkle, dbNetworks, signerMerkleNetworks } from "../drizzle/schema"
import { getDb } from "../src/db"

const { drizzle: db } = getDb()

async function seed() {
	const signers = [
		{
			publicKey: "B62qjpbiYvHwbU5ARVbE5neMcuxfxg2zt8wHjkWVKHEiD1micG92CtJ",
			permission: 1, // deploy
			networks: ["mina:devnet", "zeko:testnet"] as const
		},
		{
			publicKey: "B62qic5sGvm6QvFzJ92588YgkKxzqi2kFeYydnkM8VDAvY9arDgY6m6",
			permission: 31, // all
			networks: ["mina:devnet", "zeko:testnet"] as const
		},
		{
			publicKey: "B62qkjzL662Z5QD16cB9j6Q5TH74y42ALsMhAiyrwWvWwWV1ypfcV65",
			permission: 31, // all
			networks: ["mina:devnet", "zeko:testnet"] as const
		},
		{
			publicKey: "B62qjabhmpW9yfLbvUz87BR1u462RRqFfXgoapz8X3Fw8uaXJqGG8WH",
			permission: 31, // all
			networks: ["mina:devnet", "zeko:testnet"] as const
		},
		{
			publicKey: "B62qpLxXFg4rmhce762uiJjNRnp5Bzc9PnCEAcraeaMkVWkPi7kgsWV",
			permission: 31, // all
			networks: ["mina:devnet", "zeko:testnet"] as const
		},
		{
			publicKey: "B62qrgWEGhgXQ5PnpEaeJqs1MRx4Jiw2aqSTfyxAsEVDJzqNFm9PEQt",
			permission: 31, // all
			networks: ["mina:devnet", "zeko:testnet"] as const
		},
		{
			publicKey: "B62qkfpRcsJjByghq8FNkzBh3wmzLYFWJP2qP9x8gJ48ekfd6MVXngy",
			permission: 31, // all
			networks: ["mina:devnet", "zeko:testnet"] as const
		},
		{
			publicKey: "B62qipa4xp6pQKqAm5qoviGoHyKaurHvLZiWf3djDNgrzdERm6AowSQ",
			permission: 31, // all
			networks: ["mina:devnet", "zeko:testnet"] as const
		}
	] as const

	console.log("🔑 Seeding signers...")
	for (const signerData of signers) {
		// Check if signer already exists
		const existing = await db
			.select()
			.from(signerMerkle)
			.where(eq(signerMerkle.publicKey, signerData.publicKey))
			.limit(1)
			.then((result) => result.length > 0)

		if (!existing) {
			// Insert new signer
			await db.insert(signerMerkle).values({ publicKey: signerData.publicKey }).returning()
			console.log(`✅ Signer inserted: ${signerData.publicKey}`)
		} else {
			console.log(`⚠️  Signer already exists: ${signerData.publicKey}`)
		}

		// Get the signer Id of this public key
		const [signer] = await db
			.select({ id: signerMerkle.id })
			.from(signerMerkle)
			.where(eq(signerMerkle.publicKey, signerData.publicKey))
			.limit(1)

		const signerId = signer?.id

		// Insert network permissions for this signer
		for (const network of signerData.networks) {
			try {
				// Use onConflictDoNothing to handle duplicates properly
				const result = await db
					.insert(signerMerkleNetworks)
					.values({
						signerId,
						network,
						permission: signerData.permission,
						active: true
					})
					.onConflictDoNothing()
					.returning()

				if (result.length > 0) {
					console.log(
						`   ✅ Permission added: ${network} (${signerData.permission === 1 ? "deploy" : "all"}) for signer ID: ${signerId}`
					)
				} else {
					console.log(`   ⚠️  Permission already exists: ${network} for signer ID: ${signerId}`)
				}
			} catch (error) {
				console.error(
					`   ❌ Error inserting permission for ${network}, signer ID: ${signerId}:`,
					error
				)
			}
		}
	}

	console.log("✅ Seed completed.")
}

seed()
	.then(() => {
		console.log("🎉 Seeding finished successfully!")
		db.$client.end()
	})
	.catch((error) => {
		console.error("❌ Seeding failed:", error)
		db.$client.end()
		process.exit(1)
	})
