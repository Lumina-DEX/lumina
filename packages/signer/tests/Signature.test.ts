import { string } from "arktype/out/keywords/string.js"
import { encryptedKeyToField, getUniqueUserPairs, PoolKey } from "../src/utils/utils.js"
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
import { createClient } from "@supabase/supabase-js"
import { Database } from "../src/supabase.js"
import { SignatureRight } from "@lumina-dex/contracts"
import dotenv from "dotenv"

// configures dotenv to work in your application
dotenv.config()

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

		const pairs = getUniqueUserPairs(users, poolKey, poolPub)

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

		const supabase = createClient<Database>(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

		const { data, error } = await supabase.from("Merkle").select().eq("active", true)

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
			const pubKey = PublicKey.fromBase58(x.user)
			merkle.set(Poseidon.hash(pubKey.toFields()), right)

			if (x.right === "all") {
				users.push(x.user)
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
		const { data: poolKeyData } = await supabase
			.from("PoolKey")
			.select()
			.in("signer_1", signerArray)
			.in("signer_2", signerArray)
			.neq("signer_1", "signer_2") // pour éviter signer_1 === signer_2
			.limit(1)
			.single()

		console.log("poolKeyData", poolKeyData)
		const element: PoolKey = poolKeyData
		const pkA = element.signer_1 === pubSigner1 ? pkSigner1 : pkSigner2
		const pkB = element.signer_2 === pubSigner1 ? pkSigner1 : pkSigner2

		// test encryption decryption works successfully
		const encryptedFields = encryptedKeyToField(element.encrypted_key)

		const cypherB: Encryption.CipherText = {
			cipherText: encryptedFields,
			publicKey: PublicKey.fromBase58(element.generated_public_2).toGroup()
		}
		const decodeB = Encryption.decrypt(cypherB, pkB)
		const cypherA: Encryption.CipherText = {
			cipherText: decodeB,
			publicKey: PublicKey.fromBase58(element.generated_public_1).toGroup()
		}
		const decodeKey = Encryption.decrypt(cypherA, pkA)
		const plainKey = Encoding.stringFromFields(decodeKey)
		const privPool = PrivateKey.fromBase58(plainKey)

		expect(privPool.toPublicKey().toBase58()).toEqual(element.public_key)
	})
})
