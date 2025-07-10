import { eq } from "drizzle-orm"
import { drizzle } from "drizzle-orm/libsql"
import { PrivateKey } from "o1js"
import { relations } from "../drizzle/relations"
import { pool, signerMerkle } from "../drizzle/schema"

const db = drizzle("file:local.db", { relations }) //Hardcode so that it runs only in dev.

// Key 1
export const privateKey1 = PrivateKey.fromBase58(
	"EKFKLzhYijGm4mNW7V4nyQ6YQiEcgoWcYzZKjvoqcunfLZNbzBDc"
)
const publicKey1 = privateKey1.toPublicKey()
const publicKey1String = publicKey1.toBase58()
// Key 2
export const privateKey2 = PrivateKey.fromBase58(
	"EKF1sPtg2TY2vJ3Hm3y9gcage5HRNajEDt1gY73Dz1jTaP4VtU51"
)
const publicKey2 = privateKey2.toPublicKey()
const publicKey2String = publicKey2.toBase58()

async function seed() {
	const signers = [
		{
			publicKey: publicKey1String,
			permission: "deploy",
			active: true
		},
		{
			publicKey: publicKey2String,
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

	await db
		.insert(pool)
		.values({
			tokenA: "MINA",
			tokenB: "B62qqbQt3E4re5VLpgsQnhDj4R4bYvhXLds1dK9nRiUBRF9wweFxadW",
			user: "B62qkjzL662Z5QD16cB9j6Q5TH74y42ALsMhAiyrwWvWwWV1ypfcV65",
			publicKey: PrivateKey.random().toPublicKey().toBase58(),
			deployed: true
		})
		.returning()

	console.log("✅ Seed completed.")
}

seed()
