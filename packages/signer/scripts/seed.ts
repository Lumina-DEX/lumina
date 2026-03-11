import { readFile } from "node:fs/promises"
import { and, eq } from "drizzle-orm"
import { signerMerkle, signerMerkleNetworks } from "../drizzle/schema"
import { getDb } from "../src/db"

const { drizzle: db } = getDb()
const networkByTarget = {
	"zeko-testnet": "zeko:testnet",
	"mina-mainnet": "mina:mainnet",
	"zeko-mainnet": "zeko:mainnet",
	"mina-devnet": "mina:devnet"
} as const

type KnownNetwork = (typeof networkByTarget)[keyof typeof networkByTarget]
type SeedSigner = {
	publicKey: string
	permission: number
	networks: readonly KnownNetwork[]
	active?: boolean
}

async function loadSigners(): Promise<SeedSigner[]> {
	const seedFile = process.env.SIGNER_SEED_FILE
	const targetEnv = process.env.SIGNER_SEED_TARGET_ENV as keyof typeof networkByTarget | undefined

	if (!seedFile) {
		return [
			{
				publicKey: "B62qjpbiYvHwbU5ARVbE5neMcuxfxg2zt8wHjkWVKHEiD1micG92CtJ",
				permission: 1,
				networks: ["mina:devnet", "zeko:testnet"]
			},
			{
				publicKey: "B62qic5sGvm6QvFzJ92588YgkKxzqi2kFeYydnkM8VDAvY9arDgY6m6",
				permission: 31,
				networks: ["mina:devnet", "zeko:testnet"]
			},
			{
				publicKey: "B62qkjzL662Z5QD16cB9j6Q5TH74y42ALsMhAiyrwWvWwWV1ypfcV65",
				permission: 31,
				networks: ["mina:devnet", "zeko:testnet"]
			},
			{
				publicKey: "B62qjabhmpW9yfLbvUz87BR1u462RRqFfXgoapz8X3Fw8uaXJqGG8WH",
				permission: 31,
				networks: ["mina:devnet", "zeko:testnet"]
			},
			{
				publicKey: "B62qpLxXFg4rmhce762uiJjNRnp5Bzc9PnCEAcraeaMkVWkPi7kgsWV",
				permission: 31,
				networks: ["mina:devnet", "zeko:testnet"]
			},
			{
				publicKey: "B62qrgWEGhgXQ5PnpEaeJqs1MRx4Jiw2aqSTfyxAsEVDJzqNFm9PEQt",
				permission: 31,
				networks: ["mina:devnet", "zeko:testnet"]
			},
			{
				publicKey: "B62qkfpRcsJjByghq8FNkzBh3wmzLYFWJP2qP9x8gJ48ekfd6MVXngy",
				permission: 31,
				networks: ["mina:devnet", "zeko:testnet"]
			},
			{
				publicKey: "B62qipa4xp6pQKqAm5qoviGoHyKaurHvLZiWf3djDNgrzdERm6AowSQ",
				permission: 31,
				networks: ["mina:devnet", "zeko:testnet"]
			}
		] satisfies SeedSigner[]
	}

	const raw = JSON.parse(await readFile(seedFile, "utf8")) as { signers?: Omit<SeedSigner, "networks"> & { networks?: KnownNetwork[] }[] } | Omit<SeedSigner, "networks"> & { networks?: KnownNetwork[] }[]
	const signers = Array.isArray(raw) ? raw : raw.signers

	if (!Array.isArray(signers) || signers.length === 0) {
		throw new Error(`No signers found in ${seedFile}`)
	}

	return signers.map((signer) => {
		const networks = signer.networks?.length ? signer.networks : targetEnv ? [networkByTarget[targetEnv]] : []
		if (!signer.publicKey || typeof signer.permission !== "number" || networks.length === 0) {
			throw new Error(`Invalid signer seed entry in ${seedFile}`)
		}
		return {
			publicKey: signer.publicKey,
			permission: signer.permission,
			networks,
			active: signer.active ?? true
		}
	})
}

async function seed() {
	const signers = await loadSigners()

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
			await db.insert(signerMerkle).values({ publicKey: signerData.publicKey })
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

		if (!signer) continue
		const signerId = signer.id

		// Insert network permissions for this signer
		for (const network of signerData.networks) {
			try {
				const existingNetwork = await db
					.select()
					.from(signerMerkleNetworks)
					.where(and(eq(signerMerkleNetworks.signerId, signerId), eq(signerMerkleNetworks.network, network)))
					.limit(1)

				if (existingNetwork.length === 0) {
					await db.insert(signerMerkleNetworks).values({
						signerId,
						network,
						permission: signerData.permission,
						active: signerData.active ?? true
					})
					console.log(
						`   ✅ Permission added: ${network} (${
							signerData.permission === 1 ? "deploy" : "all"
						}) for signer ID: ${signerId}`
					)
					continue
				}

				await db
					.update(signerMerkleNetworks)
					.set({
						permission: signerData.permission,
						active: signerData.active ?? true
					})
					.where(and(eq(signerMerkleNetworks.signerId, signerId), eq(signerMerkleNetworks.network, network)))

				console.log(`   ♻️  Permission updated: ${network} for signer ID: ${signerId}`)
			} catch (error) {
				console.error(`   ❌ Error writing permission for ${network}, signer ID: ${signerId}:`, error)
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
