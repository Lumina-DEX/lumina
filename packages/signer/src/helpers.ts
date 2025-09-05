import { InfisicalSDK } from "@infisical/sdk"
import { FungibleToken, PoolFactory, SignatureRight } from "@lumina-dex/contracts"
import { defaultCreationFee, defaultFee, networks, type Networks, urls } from "@lumina-dex/sdk"
import { and, eq } from "drizzle-orm"
import {
	AccountUpdate,
	Bool,
	Cache,
	Encoding,
	Encryption,
	Field,
	MerkleMap,
	Mina,
	Poseidon,
	PublicKey,
	UInt64
} from "o1js"
import * as v from "valibot"
import {
	signerMerkle,
	signerMerkleNetworks,
	type poolKey as tPoolKey,
	dbNetworks
} from "../drizzle/schema"
import type { getDb } from "./db"

export const getEnv = () => {
	const Schema = v.object({
		DATABASE_URL: v.string(),
		INFISICAL_ENVIRONMENT: v.string(),
		INFISICAL_PROJECT_ID: v.string(),
		INFISICAL_SECRET_NAME: v.string(),
		INFISICAL_CLIENT_ID: v.string(),
		INFISICAL_CLIENT_SECRET: v.string()
	})
	const env = v.parse(Schema, process.env)
	return env
}

type NewPoolKey = typeof tPoolKey.$inferInsert
type NewSignerMerkle = {
	id: number
	publicKey: string
	createdAt: Date
	permission: string
}

// list of different approved user to sign

export async function getMerkle(
	database: ReturnType<typeof getDb>["drizzle"],
	network: Networks
): Promise<[MerkleMap, NewSignerMerkle[]]> {
	let users: NewSignerMerkle[] = []

	const data = await database
		.select({
			id: signerMerkle.id,
			publicKey: signerMerkle.publicKey,
			createdAt: signerMerkle.createdAt,
			permission: signerMerkleNetworks.permission
		})
		.from(signerMerkle)
		.innerJoin(signerMerkleNetworks, eq(signerMerkle.id, signerMerkleNetworks.signerId))
		.innerJoin(dbNetworks, eq(signerMerkleNetworks.networkId, dbNetworks.id))
		.where(and(eq(dbNetworks.network, network), eq(signerMerkleNetworks.active, true)))

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
	users = []
	data.forEach((x) => {
		let right = allRight.hash()
		switch (x.permission) {
			case "deploy":
				right = deployRight.hash()
				break
			default:
				right = allRight.hash()
				break
		}
		const pubKey = PublicKey.fromBase58(x.publicKey)
		merkle.set(Poseidon.hash(pubKey.toFields()), right)

		if (x.permission === "all") {
			users.push(x)
		}
	})

	return [merkle, users]
}

export function getUniqueUserPairs(
	users: NewSignerMerkle[],
	poolId: number,
	key: string
): NewPoolKey[] {
	const pairs = []

	for (let i = 0; i < users.length; i++) {
		for (let j = i + 1; j < users.length; j++) {
			const userA = users[i]
			const userB = users[j]
			// double encryption to need multisig to decode the key
			const encrypA = Encryption.encrypt(
				Encoding.stringToFields(key),
				PublicKey.fromBase58(userA.publicKey)
			)
			const encryptAPub = PublicKey.fromGroup(encrypA.publicKey).toBase58()
			const encrypB = Encryption.encrypt(encrypA.cipherText, PublicKey.fromBase58(userB.publicKey))
			const encryptBPub = PublicKey.fromGroup(encrypB.publicKey).toBase58()
			const encrypted_key = encrypB.cipherText.join(",")
			const poolKeyRow: NewPoolKey = {
				poolId: poolId,
				signer1Id: userA.id,
				signer2Id: userB.id,
				generatedPublic1: encryptAPub,
				generatedPublic2: encryptBPub,
				encryptedKey: encrypted_key
			}
			pairs.push(poolKeyRow)
		}
	}

	return pairs
}

export function encryptedKeyToField(encryptedKey: string): Field[] {
	return encryptedKey.split(",").map((x) => Field.from(x))
}

export async function getMasterSigner(): Promise<string> {
	const client = new InfisicalSDK()
	const env = getEnv()
	// Authenticate with Infisical
	await client.auth().universalAuth.login({
		clientId: env.INFISICAL_CLIENT_ID, // Infisical client ID
		clientSecret: env.INFISICAL_CLIENT_SECRET // Infisical client secret
	})

	const singleSecret = await client.secrets().getSecret({
		environment: env.INFISICAL_ENVIRONMENT, // stg, dev, prod, or custom environment slugs
		projectId: env.INFISICAL_PROJECT_ID,
		secretName: env.INFISICAL_SECRET_NAME
	})

	return singleSecret.secretValue
}

export const fundNewAccount = (network: Networks, feePayer: PublicKey, numberOfAccounts = 1) => {
	try {
		const creationFee = defaultCreationFee[network]
		const accountUpdate = AccountUpdate.createSigned(feePayer)
		accountUpdate.label = "AccountUpdate.fundNewAccount()"
		const fee = (
			creationFee
				? UInt64.from(creationFee)
				: Mina.activeInstance.getNetworkConstants().accountCreationFee
		).mul(numberOfAccounts)
		accountUpdate.balance.subInPlace(fee)
		return accountUpdate
	} catch (error) {
		console.error("fund new account", error)
		return AccountUpdate.fundNewAccount(feePayer, numberOfAccounts)
	}
}

export const getFee = (network: Networks) => {
	const fee = defaultFee[network]
	if (!fee) return 0
	return fee
}

export function getNetwork(network: Networks): ReturnType<typeof Mina.Network> {
	return Mina.Network({
		networkId: network.includes("mainnet") ? "mainnet" : "testnet",
		mina: urls[network]
	})
}

export const compileContracts = async () => {
	console.log("Compiling contracts...")
	// setNumberOfWorkers(4)
	console.time("compile")
	const cache = Cache.FileSystem("./cache")
	console.log("compile pool factory")
	await PoolFactory.compile({ cache })
	console.log("compile pool fungible token")
	await FungibleToken.compile({ cache })
	console.timeEnd("compile")
}
