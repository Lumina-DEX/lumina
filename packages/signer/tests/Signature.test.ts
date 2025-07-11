import { encryptedKeyToField } from "../src/workers/sandbox.js"
import {
	Bool,
	Encoding,
	Encryption,
	initializeBindings,
	MerkleMap,
	Poseidon,
	PrivateKey,
	Provable,
	PublicKey
} from "o1js"
import { beforeAll, beforeEach, describe, expect, it } from "vitest"
import { Pool, SignatureRight } from "@lumina-dex/contracts"
import dotenv from "dotenv"
import { InfisicalSDK } from "@infisical/sdk"
import { drizzle } from "drizzle-orm/libsql"
import { eq, or, and } from "drizzle-orm"
import { pool, signerMerkle, poolKey as tPoolKey } from "../src/db/schema"

// configures dotenv to work in your application
dotenv.config()

type NewPoolKey = typeof tPoolKey.$inferInsert

export type PoolKey = {
	public_key: string
	signer_1: string
	signer_2: string
	encrypted_key: string
	generated_public_1: string
	generated_public_2: string
}

describe("Signature", () => {
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
			}
		}
	})

	it("decrypt from db", async () => {
		await initializeBindings()

		const sign1 = process.env.SIGNER1
		const sign2 = process.env.SIGNER2

		if (!sign1 || !sign2) {
			console.warn("signer not found")
			return
		}

		const db = drizzle(process.env.DB_FILE_NAME!)
		const data = await db.select().from(signerMerkle).where(eq(signerMerkle.active, true))

		const allRight = new SignatureRight(
			Bool(true),
			Bool(true),
			Bool(true),
			Bool(true),
			Bool(true),
			Bool(true)
		)
		const deployRight = SignatureRight.canDeployPool()
		const merkle = new MerkleMap()
		const users = []
		data.forEach((x) => {
			let right = allRight.hash()
			switch (x.right) {
				case "deploy":
					right = deployRight.hash()
					break
				default:
					right = allRight.hash()
					break
			}
			const pubKey = PublicKey.fromBase58(x.publicKey)
			merkle.set(Poseidon.hash(pubKey.toFields()), right)

			if (x.right === "all") {
				users.push(x.publicKey)
			}
		})

		const pkSigner1 = PrivateKey.fromBase58(sign1)
		const pubSigner1 = pkSigner1.toPublicKey().toBase58()
		const signer1Db = await db
			.select()
			.from(signerMerkle)
			.where(eq(signerMerkle.publicKey, pubSigner1))
			.limit(1)
		const pkSigner1Id = signer1Db[0].id
		const pkSigner2 = PrivateKey.fromBase58(sign2)
		const pubSigner2 = pkSigner2.toPublicKey().toBase58()
		const signer2Db = await db
			.select()
			.from(signerMerkle)
			.where(eq(signerMerkle.publicKey, pubSigner2))
			.limit(1)
		const pkSigner2Id = signer2Db[0].id
		// @ts-ignore
		console.log(pubSigner1)
		console.log(pubSigner2)
		const signerArray = [pubSigner1, pubSigner2]
		const poolKeyData = await db
			.select()
			.from(tPoolKey)
			.where(
				or(
					and(eq(tPoolKey.signer1Id, pkSigner1Id), eq(tPoolKey.signer2Id, pkSigner2Id)),
					and(eq(tPoolKey.signer1Id, pkSigner1Id), eq(tPoolKey.signer2Id, pkSigner2Id))
				)
			)
			.limit(1)

		console.log("poolKeyData", poolKeyData)
		const element: NewPoolKey = poolKeyData[0]

		const poolPublicInfo = await db.select().from(pool).where(eq(pool.id, element.poolId)).limit(1)
		const poolPublicKey = poolPublicInfo[0].publicKey

		const pkA = element.signer1Id === pkSigner1Id ? pkSigner1 : pkSigner2
		const pkB = element.signer2Id === pkSigner1Id ? pkSigner1 : pkSigner2

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
	})

	it("fetch secret", async () => {
		const client = new InfisicalSDK()

		// Authenticate with Infisical
		await client.auth().accessToken(process.env.INFISICAL_TOKEN)

		const singleSecret = await client.secrets().getSecret({
			environment: process.env.INFISICAL_ENVIRONMENT, // stg, dev, prod, or custom environment slugs
			projectId: process.env.INFISICAL_PROJECT_ID,
			secretName: process.env.INFISICAL_SECRET_NAME
		})

		expect(singleSecret?.secretValue).toBeDefined()
		console.log("Fetched secrets", singleSecret)
	})

	function getUniqueUserPairsTest(users: any[], key: string, publicKey: string): PoolKey[] {
		const pairs = []

		for (let i = 0; i < users.length; i++) {
			for (let j = i + 1; j < users.length; j++) {
				const userA = users[i]
				const userB = users[j]
				// double encryption to need multisig to decode the key
				const encrypA = Encryption.encrypt(
					Encoding.stringToFields(key),
					PublicKey.fromBase58(userA)
				)
				const encryptAPub = PublicKey.fromGroup(encrypA.publicKey).toBase58()
				const encrypB = Encryption.encrypt(encrypA.cipherText, PublicKey.fromBase58(userB))
				const encryptBPub = PublicKey.fromGroup(encrypB.publicKey).toBase58()
				const encrypted_key = encrypB.cipherText.join(",")
				const poolKeyRow: PoolKey = {
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
