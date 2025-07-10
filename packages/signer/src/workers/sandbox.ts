import { InfisicalSDK } from "@infisical/sdk"
import { FungibleToken, PoolFactory, SignatureRight } from "@lumina-dex/contracts"
import { defaultCreationFee, defaultFee, MINA_ADDRESS, urls } from "@lumina-dex/sdk"
import type { Job } from "bullmq"
import { eq } from "drizzle-orm"
import { drizzle } from "drizzle-orm/libsql"
import {
	AccountUpdate,
	Bool,
	Cache,
	Encoding,
	Encryption,
	Field,
	fetchAccount,
	MerkleMap,
	Mina,
	Poseidon,
	PrivateKey,
	PublicKey,
	Signature,
	setNumberOfWorkers,
	UInt64
} from "o1js"
import * as v from "valibot"
import { pool, signerMerkle, poolKey as tPoolKey } from "../../drizzle/schema"

const Schema = v.object({
	POOL_FACTORY_PUBLIC_KEY: v.string(),
	DB_FILE_NAME: v.string(),
	INFISICAL_ENVIRONMENT: v.string(),
	INFISICAL_PROJECT_ID: v.string(),
	INFISICAL_SECRET_NAME: v.string(),
	INFISICAL_CLIENT_ID: v.string(),
	INFISICAL_CLIENT_SECRET: v.string()
})
const env = v.parse(Schema, process.env)

const db = drizzle(env.DB_FILE_NAME)

type NewPoolKey = typeof tPoolKey.$inferInsert
type NewSignerMerkle = typeof signerMerkle.$inferSelect

// list of different approved user to sign
let users: NewSignerMerkle[] = []

setNumberOfWorkers(4)

console.time("compile")
//const cacheFiles = await fetchFromServerFiles();
const cache = Cache.FileSystem("./cache")
console.log("compile pool factory")
await PoolFactory.compile({ cache })
console.log("compile pool fungible token")
await FungibleToken.compile({ cache })
console.timeEnd("compile")

export function getNetwork(network: string) {
	return Mina.Network({
		networkId: network.includes("mainnet") ? "mainnet" : "testnet",
		mina: urls[network]
	})
}

/**
 * Sandbox worker to parrellize o1js proof
 * @param job
 * @returns
 */
export default async function (job: Job) {
	try {
		await job.log("Start processing job")
		const id = job.id
		console.log("job id", id)

		const { tokenA, tokenB, user, network, onlyCompile } = job.data

		if (onlyCompile) {
			return "Compiled"
		}

		const Network = getNetwork(network)
		Mina.setActiveInstance(Network)

		console.log("data", { tokenA, tokenB, user })
		const newPoolPrivateKey = PrivateKey.random()
		const newPoolPublicKey = newPoolPrivateKey.toPublicKey()
		console.debug("pool public Key", newPoolPublicKey.toBase58())

		const deployRight = SignatureRight.canDeployPool()

		const merkle = await getMerkle()

		const masterSigner = await getMasterSigner()
		const masterSignerPrivateKey = PrivateKey.fromBase58(masterSigner)
		const masterSignerPublicKey = masterSignerPrivateKey.toPublicKey()

		const minaTransaction = await db.transaction(async (txOrm) => {
			// insert this new pool in database
			const result = await txOrm
				.insert(pool)
				.values({
					publicKey: newPoolPublicKey.toBase58(),
					tokenA: tokenA,
					tokenB: tokenB,
					user: user
				})
				.returning({ insertedId: pool.id })

			const poolId = result[0].insertedId
			const listPair = getUniqueUserPairs(users, poolId, newPoolPrivateKey.toBase58())
			// insert the encrypted key of the pool in database
			await txOrm.insert(tPoolKey).values(listPair)

			const signature = Signature.create(
				masterSignerPrivateKey,
				newPoolPrivateKey.toPublicKey().toFields()
			)
			const witness = merkle.getWitness(Poseidon.hash(masterSignerPublicKey.toFields()))
			const factory = env.POOL_FACTORY_PUBLIC_KEY
			const factoryKey = PublicKey.fromBase58(factory)
			const zkFactory = new PoolFactory(factoryKey)

			await fetchAccount({ publicKey: factoryKey })
			const isMinaTokenPool = tokenA === MINA_ADDRESS || tokenB === MINA_ADDRESS
			console.debug({ isMinaTokenPool })
			console.time("prove")
			const minaTx = await Mina.transaction(
				{
					sender: PublicKey.fromBase58(user),
					fee: getFee(network)
				},
				async () => {
					fundNewAccount(network, PublicKey.fromBase58(user), 4)
					if (isMinaTokenPool) {
						const token = tokenA === MINA_ADDRESS ? tokenB : tokenA
						await zkFactory.createPool(
							newPoolPublicKey,
							PublicKey.fromBase58(token),
							masterSignerPublicKey,
							signature,
							witness,
							deployRight
						)
					}
					if (!isMinaTokenPool) {
						await zkFactory.createPoolToken(
							newPoolPublicKey,
							PublicKey.fromBase58(tokenA),
							PublicKey.fromBase58(tokenB),
							masterSignerPublicKey,
							signature,
							witness,
							deployRight
						)
					}
				}
			)
			minaTx.sign([newPoolPrivateKey])
			await minaTx.prove()
			console.timeEnd("prove")
			console.log("job end", id)
			return minaTx
		})
		return {
			pool: newPoolPrivateKey.toPublicKey().toBase58(),
			transaction: minaTransaction.toJSON()
		}
	} catch (error) {
		console.error(error)
		throw error
	}
}

export async function getMerkle(): Promise<MerkleMap> {
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

	return merkle
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

async function getMasterSigner(): Promise<string> {
	const client = new InfisicalSDK()

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

const fundNewAccount = async (network: string, feePayer: PublicKey, numberOfAccounts = 1) => {
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

const getFee = (network: string) => {
	const fee = defaultFee[network]
	if (!fee) throw new Error(`No fee found for network: ${network}`)
	return fee
}
