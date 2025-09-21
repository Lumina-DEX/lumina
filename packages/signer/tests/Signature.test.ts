import { allRight, PoolFactory } from "@lumina-dex/contracts"
import { luminadexFactories } from "@lumina-dex/sdk"
import { and, eq } from "drizzle-orm"
import { Encoding, Encryption, fetchAccount, initializeBindings, Mina, PrivateKey, PublicKey } from "o1js"
import * as v from "valibot"
import { describe, expect, it } from "vitest"
import { pool, poolKey as tPoolKey, signerMerkle, signerMerkleNetworks } from "../drizzle/schema"
import { getDb } from "../src/db"
import { encryptedKeyToField, getMasterSigner, getMerkle, getNetwork } from "../src/helpers"

const Schema = v.object({
	DATABASE_URL: v.string(),
	INFISICAL_ENVIRONMENT: v.string(),
	INFISICAL_PROJECT_ID: v.string(),
	INFISICAL_CLIENT_ID: v.string(),
	INFISICAL_CLIENT_SECRET: v.string()
})
const env = v.parse(Schema, process.env)
if (env.DATABASE_URL.includes("supabase")) {
	throw new Error("Supabase detected, do not run test against prod urls.")
}

const { drizzle: db } = getDb()
describe("Signature", () => {
	it("rebuild merkle", async () => {
		const network = "mina:devnet" as const

		const [merkleMap] = await getMerkle(db, network)

		const root = merkleMap.getRoot()

		console.log("root", root.toBigInt())

		const Network = getNetwork(network)
		Mina.setActiveInstance(Network)
		const factoryKey = PublicKey.fromBase58(luminadexFactories[network])
		await fetchAccount({ publicKey: factoryKey })
		const zkFactory = new PoolFactory(factoryKey)
		const factoryRoot = zkFactory.approvedSigner.getAndRequireEquals()

		expect(root.value).toEqual(factoryRoot.value)
	})

	it("fetch secret", async () => {
		const secret = await getMasterSigner()
		expect(secret).toBeDefined()
	})

	it("encrypt/decrypt", async () => {
		await initializeBindings()

		const charles = PrivateKey.random()
		const alice = PrivateKey.random()
		const bob = PrivateKey.random()
		const charlesPub = charles.toPublicKey().toBase58()
		const alicePub = alice.toPublicKey().toBase58()
		const bobPub = bob.toPublicKey().toBase58()

		const users = [charlesPub, alicePub, bobPub]

		const pool = PrivateKey.random()
		const poolKey = pool.toBase58()
		const poolPub = pool.toPublicKey().toBase58()

		const pairs = getUniqueUserPairsTest(users, poolKey, poolPub)

		for (let index = 0; index < pairs.length; index++) {
			const element = pairs[index]

			const pk1 = getPrivateKey(element.signer_1)
			const pk2 = getPrivateKey(element.signer_2)

			// test encryption decryption works successfully
			const encryptedFields = encryptedKeyToField(element.encrypted_key)

			const cypherB: Encryption.CipherText = {
				cipherText: encryptedFields,
				publicKey: PublicKey.fromBase58(element.generated_public_2).toGroup()
			}
			const decodeB = Encryption.decrypt(cypherB, pk2)
			const cypherA: Encryption.CipherText = {
				cipherText: decodeB,
				publicKey: PublicKey.fromBase58(element.generated_public_1).toGroup()
			}
			const decodeKey = Encryption.decrypt(cypherA, pk1)
			const plainKey = Encoding.stringFromFields(decodeKey)

			expect(plainKey).toEqual(poolKey)
		}

		function getPrivateKey(pubKey: string): PrivateKey {
			switch (pubKey) {
				case charlesPub:
					return charles
				case alicePub:
					return alice
				case bobPub:
					return bob
				default:
					throw new Error(`Unknown public key: ${pubKey}`)
			}
		}
	})

	it("decrypt from db", async () => {
		await initializeBindings()

		const network = "zeko:testnet" as const

		const [_merkleMap, data] = await getMerkle(db, network)

		// Pick two signers with permission 'all' for the test
		const testSigners = data.filter((x) => x.permission === Number(allRight)).slice(0, 2)
		if (testSigners.length < 2) {
			throw new Error("Need at least 2 active signers with 'all' permission in DB")
		}

		// Generate test private keys for these signers
		const testPrivA = PrivateKey.random()
		const testPrivB = PrivateKey.random()
		const testPubA = testPrivA.toPublicKey().toBase58()
		const testPubB = testPrivB.toPublicKey().toBase58()

		// Generate a new pool key
		const testPoolPriv = PrivateKey.random()
		const testPoolPub = testPoolPriv.toPublicKey().toBase58()
		const testPoolKey = testPoolPriv.toBase58()
		const tokenA = "TEST_TOKEN_A"
		const tokenB = "TEST_TOKEN_B"
		const user = testPubA

		await db.transaction(async (tx) => {
			try {
				// Insert pool
				const poolInsert = await tx
					.insert(pool)
					.values({
						jobId: "test-job-id",
						network,
						publicKey: testPoolPub,
						tokenA,
						tokenB,
						user,
						status: "pending"
					})
					.returning({ insertedId: pool.id })
				const insertedPoolId = poolInsert[0].insertedId

				// Prepare poolKey row using sandbox logic
				const encrypA = Encryption.encrypt(Encoding.stringToFields(testPoolKey), PublicKey.fromBase58(testPubA))
				const encryptAPub = PublicKey.fromGroup(encrypA.publicKey).toBase58()
				const encrypB = Encryption.encrypt(encrypA.cipherText, PublicKey.fromBase58(testPubB))
				const encryptBPub = PublicKey.fromGroup(encrypB.publicKey).toBase58()
				const encrypted_key = encrypB.cipherText.join(",")

				// Insert two test signers if not present
				const [signerA] = await tx.select().from(signerMerkle).where(eq(signerMerkle.publicKey, testPubA)).limit(1)
				const [signerB] = await tx.select().from(signerMerkle).where(eq(signerMerkle.publicKey, testPubB)).limit(1)
				let signerAId = signerA?.id
				let signerBId = signerB?.id
				if (!signerAId) {
					const res = await tx
						.insert(signerMerkle)
						.values({ publicKey: testPubA })
						.returning({ insertedId: signerMerkle.id })

					signerAId = res[0].insertedId

					await tx.insert(signerMerkleNetworks).values({
						signerId: signerAId,
						network,
						permission: Number(allRight),
						active: true
					})
				}
				if (!signerBId) {
					const res = await tx
						.insert(signerMerkle)
						.values({ publicKey: testPubB })
						.returning({ insertedId: signerMerkle.id })
					signerBId = res[0].insertedId

					await tx.insert(signerMerkleNetworks).values({
						signerId: signerBId,
						network,
						permission: Number(allRight),
						active: true
					})
				}

				const poolKeyRow = {
					poolId: insertedPoolId,
					signer1Id: signerAId,
					signer2Id: signerBId,
					generatedPublic1: encryptAPub,
					generatedPublic2: encryptBPub,
					encryptedKey: encrypted_key
				}
				await tx.insert(tPoolKey).values(poolKeyRow).returning({ insertedId: tPoolKey.id })

				// Now fetch and test as before
				const [element] = await tx
					.select()
					.from(tPoolKey)
					.where(
						and(
							eq(tPoolKey.signer1Id, signerAId),
							eq(tPoolKey.signer2Id, signerBId),
							eq(tPoolKey.poolId, insertedPoolId)
						)
					)
					.limit(1)
				if (!element.poolId) throw new Error("No poolId found on inserted poolKey row")
				const poolPublicInfo = await tx.select().from(pool).where(eq(pool.id, element.poolId)).limit(1)
				const poolPublicKey = poolPublicInfo[0].publicKey

				const pkA = testPrivA
				const pkB = testPrivB

				// test encryption decryption works successfully
				const encryptedFields = encryptedKeyToField(element.encryptedKey)

				const cypherB: Encryption.CipherText = {
					cipherText: encryptedFields,
					publicKey: PublicKey.fromBase58(element.generatedPublic2).toGroup()
				}
				const decodeB = Encryption.decrypt(cypherB, pkB)
				const cypherA: Encryption.CipherText = {
					cipherText: decodeB,
					publicKey: PublicKey.fromBase58(element.generatedPublic1).toGroup()
				}
				const decodeKey = Encryption.decrypt(cypherA, pkA)
				const plainKey = Encoding.stringFromFields(decodeKey)
				const privPool = PrivateKey.fromBase58(plainKey)

				expect(privPool.toPublicKey().toBase58()).toEqual(poolPublicKey)
			} finally {
				try {
					tx.rollback()
				} catch {}
			}
		})
	})

	function getUniqueUserPairsTest(users: string[], key: string, publicKey: string) {
		const pairs = []

		for (let i = 0; i < users.length; i++) {
			for (let j = i + 1; j < users.length; j++) {
				const userA = users[i]
				const userB = users[j]
				// double encryption to need multisig to decode the key
				const encrypA = Encryption.encrypt(Encoding.stringToFields(key), PublicKey.fromBase58(userA))
				const encryptAPub = PublicKey.fromGroup(encrypA.publicKey).toBase58()
				const encrypB = Encryption.encrypt(encrypA.cipherText, PublicKey.fromBase58(userB))
				const encryptBPub = PublicKey.fromGroup(encrypB.publicKey).toBase58()
				const encrypted_key = encrypB.cipherText.join(",")
				const poolKeyRow = {
					public_key: publicKey,
					signer_1: userA,
					signer_2: userB,
					generated_public_1: encryptAPub,
					generated_public_2: encryptBPub,
					encrypted_key: encrypted_key
				}
				pairs.push(poolKeyRow)
			}
		}

		return pairs
	}
})
