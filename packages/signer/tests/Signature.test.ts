import { string } from "arktype/out/keywords/string.js"
import { encryptedKeyToField, getUniqueUserPairs } from "../src/utils/utils.js"
import { Encoding, Encryption, initializeBindings, PrivateKey, Provable, PublicKey } from "o1js"
import { beforeAll, beforeEach, describe, expect, it } from "vitest"

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
})
