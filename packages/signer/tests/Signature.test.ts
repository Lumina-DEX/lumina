import { string } from "arktype/out/keywords/string.js"
import { encryptedKeyToField, getUniqueUserPairs } from "../src/workers/sandbox.js"
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
import { signerMerkle, poolKey as tPoolKey, pool } from "../src/db/schema"

// configures dotenv to work in your application
dotenv.config()

type NewPoolKey = typeof tPoolKey.$inferInsert

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

		const db = drizzle(process.env.DB_FILE_NAME!)
		return
		const pairs = getUniqueUserPairs(users, 1, poolKey, poolPub)

		for (let index = 0; index < pairs.length; index++) {
			const element = pairs[index]

			const pk1 = getPrivateKey(element.signer1Id.toString())
			const pk2 = getPrivateKey(element.signer2Id.toString())

			// test encryption decryption works successfully
			const encryptedFields = encryptedKeyToField(element.encryptedKey)

			const cypherB: Encryption.CipherText = {
				cipherText: encryptedFields,
				publicKey: PublicKey.fromBase58(element.generatedPublic2).toGroup()
			}
			const decodeB = Encryption.decrypt(cypherB, pk2)
			const cypherA: Encryption.CipherText = {
				cipherText: decodeB,
				publicKey: PublicKey.fromBase58(element.generatedPublic1).toGroup()
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
		const pkSigner2 = PrivateKey.fromBase58(sign2)
		const pubSigner2 = pkSigner2.toPublicKey().toBase58()
		// @ts-ignore
		console.log(pubSigner1)
		console.log(pubSigner2)
		const signerArray = [pubSigner1, pubSigner2]
		const poolKeyData = await db
			.select()
			.from(tPoolKey)
			.where(
				or(
					and(eq(tPoolKey.signer1Id, 1), eq(tPoolKey.signer2Id, 1)),
					and(eq(tPoolKey.signer1Id, 2), eq(tPoolKey.signer2Id, 2))
				)
			)
			.limit(1)

		console.log("poolKeyData", poolKeyData)
		const element: NewPoolKey = poolKeyData[0]
		const pkA = element.signer1Id === 1 ? pkSigner1 : pkSigner2
		const pkB = element.signer2Id === 1 ? pkSigner1 : pkSigner2

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

		expect(privPool.toPublicKey().toBase58()).toEqual(element.poolId)
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
})
