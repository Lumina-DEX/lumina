import { InfisicalSDK } from "@infisical/sdk"
import { allRight, deployPoolRight, FungibleToken, FungibleTokenAdmin, PoolFactory } from "@lumina-dex/contracts"
import { defaultCreationFee, defaultFee, type Networks, urls } from "@lumina-dex/sdk"
import { type ConsolaInstance, createConsola } from "consola"
import { and, eq } from "drizzle-orm"
import {
	AccountUpdate,
	Cache,
	Encoding,
	Encryption,
	Field,
	MerkleMap,
	Mina,
	Poseidon,
	PrivateKey,
	PublicKey,
	UInt64
} from "o1js"
import * as v from "valibot"
import { pool, signerMerkle, signerMerkleNetworks } from "../drizzle/schema"
import type { getDb } from "./db"

type Drizzle = ReturnType<typeof getDb>["drizzle"]
type Transaction = Parameters<Parameters<Drizzle["transaction"]>[0]>[0]

export const logger = createConsola().withTag("SIGNER")
const createMeasure = (l: ConsolaInstance) => (label: string) => {
	const start = performance.now()
	let done = false
	return () => {
		if (done) return
		const end = performance.now()
		l.warn(`${label}: ${end - start} ms`)
		done = true
	}
}
const time = createMeasure(logger)

export const getEnv = () => {
	const Schema = v.object({
		DATABASE_URL: v.string(),
		INFISICAL_ENVIRONMENT: v.string(),
		INFISICAL_PROJECT_ID: v.string(),
		INFISICAL_CLIENT_ID: v.string(),
		INFISICAL_CLIENT_SECRET: v.string()
	})
	const env = v.parse(Schema, process.env)
	return env
}

type NewSignerMerkle = typeof signerMerkle.$inferSelect & {
	permission: number
}

// list of different approved user to sign

export async function getMerkle(database: Drizzle, network: Networks): Promise<[MerkleMap, NewSignerMerkle[]]> {
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
		.where(and(eq(signerMerkleNetworks.network, network), eq(signerMerkleNetworks.active, true)))

	const _allRightHash = Poseidon.hash(allRight.toFields())
	const _deployRightHash = Poseidon.hash(deployPoolRight.toFields())
	const merkle = new MerkleMap()
	users = []
	data.forEach((x) => {
		const rightHash = Poseidon.hash(Field(x.permission).toFields())
		const pubKey = PublicKey.fromBase58(x.publicKey)
		merkle.set(Poseidon.hash(pubKey.toFields()), rightHash)

		if (x.permission === Number(allRight)) {
			users.push(x)
		}
	})

	return [merkle, users]
}

export function getUniqueUserPairs(users: NewSignerMerkle[], poolId: number, key: string) {
	const pairs = []

	for (let i = 0; i < users.length; i++) {
		for (let j = i + 1; j < users.length; j++) {
			const userA = users[i]
			const userB = users[j]
			// double encryption to need multisig to decode the key
			const encrypA = Encryption.encrypt(Encoding.stringToFields(key), PublicKey.fromBase58(userA.publicKey))
			const encryptAPub = PublicKey.fromGroup(encrypA.publicKey).toBase58()
			const encrypB = Encryption.encrypt(encrypA.cipherText, PublicKey.fromBase58(userB.publicKey))
			const encryptBPub = PublicKey.fromGroup(encrypB.publicKey).toBase58()
			const encrypted_key = encrypB.cipherText.join(",")
			const poolKeyRow = {
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

export const getInfisicalSecret = async (secretName: string): Promise<string> => {
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
		secretName
	})

	return singleSecret.secretValue
}

export async function getMasterSigner(): Promise<string> {
	const secret = await getInfisicalSecret("POOL_SIGNER_PRIVATE_KEY")
	return secret
}

export const fundNewAccount = (network: Networks, feePayer: PublicKey, numberOfAccounts = 1) => {
	try {
		const creationFee = defaultCreationFee[network]
		const accountUpdate = AccountUpdate.createSigned(feePayer)
		accountUpdate.label = "AccountUpdate.fundNewAccount()"
		const fee = (
			creationFee ? UInt64.from(creationFee) : Mina.activeInstance.getNetworkConstants().accountCreationFee
		).mul(numberOfAccounts)
		accountUpdate.balance.subInPlace(fee)
		return accountUpdate
	} catch (error) {
		logger.error("fund new account", error)
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
	logger.log("Compiling contracts...")
	// setNumberOfWorkers(4)
	const c = time("compile")
	const cache = { cache: Cache.FileSystemDefault, forceRecompile: true }

	const fta = time("FungibleTokenAdmin")
	await FungibleTokenAdmin.compile(cache)
	fta()

	const ft = time("FungibleToken")
	await FungibleToken.compile(cache)
	ft()

	const pf = time("PoolFactory")
	const vk = await PoolFactory.compile(cache)
	pf()

	logger.log("factory vk hash", vk.verificationKey.hash.toBigInt())
	c()
}

export const updateStatusAndCDN = async ({ poolAddress, network }: { poolAddress: string; network: Networks }) => {
	const secret = await getInfisicalSecret("LUMINA_TOKEN_ENDPOINT_AUTH_TOKEN")
	const response = await fetch("https://cdn.luminadex.com/workflows", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${secret}`
		},
		body: JSON.stringify({ poolAddress, network })
	})
	const result = await response.json()
	return JSON.stringify(result)
}

export const createPoolKeys = async (
	database: Drizzle | Transaction
): Promise<{
	newPoolPrivateKey: PrivateKey
	newPoolPublicKey: PublicKey
	newPoolPublicKeyBase58: string
}> => {
	const newPoolPrivateKey = PrivateKey.random()
	const newPoolPublicKey = newPoolPrivateKey.toPublicKey()
	const newPoolPublicKeyBase58 = newPoolPublicKey.toBase58()
	const [exists] = await database.select().from(pool).where(eq(pool.publicKey, newPoolPublicKeyBase58))
	if (exists) return createPoolKeys(database)
	logger.log("Generated new pool key:", newPoolPublicKeyBase58)
	return { newPoolPrivateKey, newPoolPublicKey, newPoolPublicKeyBase58 }
}
