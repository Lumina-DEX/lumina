import { Encoding, Encryption, Field, PublicKey } from "o1js"

export type PoolKey = {
	public_key: string
	signer_1: string
	signer_2: string
	encrypted_key: string
	generated_public_1: string
	generated_public_2: string
}

export function getUniqueUserPairs(users: any[], key: string, publicKey: string): PoolKey[] {
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

export function encryptedKeyToField(encryptedKey: string): Field[] {
	return encryptedKey.split(",").map((x) => Field.from(x))
}
