import { Job } from "bullmq"
import {
	Account,
	AccountUpdate,
	Bool,
	Cache,
	Encoding,
	Encryption,
	Field,
	MerkleMap,
	Mina,
	NetworkId,
	Poseidon,
	PrivateKey,
	Provable,
	PublicKey,
	Signature,
	UInt32,
	UInt64,
	fetchAccount,
	setNumberOfWorkers
} from "o1js"
import { FungibleToken, PoolFactory, SignatureRight } from "@lumina-dex/contracts"
import dotenv from "dotenv"
import { createClient } from "@supabase/supabase-js"
import { InfisicalSDK } from "@infisical/sdk"
import { urls } from "@lumina-dex/sdk"
import { drizzle } from "drizzle-orm/libsql"

dotenv.config()

const db = drizzle(process.env.DB_FILE_NAME!)

// list of different approved user to sign
let users = []

setNumberOfWorkers(4)

const Network = getNetwork("mina:devnet")
Mina.setActiveInstance(Network)

console.time("compile")
//const cacheFiles = await fetchFromServerFiles();
const cache = Cache.FileSystem("./cache")
console.log("compile pool factory")
await PoolFactory.compile({ cache })
console.log("compile pool fungible token")
await FungibleToken.compile({ cache })
console.timeEnd("compile")

export type PoolKey = {
	public_key: string
	signer_1: string
	signer_2: string
	encrypted_key: string
	generated_public_1: string
	generated_public_2: string
}

export function getNetwork(network: string) {
	return Mina.Network({
		networkId: network.includes("mainnet") ? "mainnet" : "testnet",
		mina: urls[network]
	})
}

/**
 * Sandbow worker to parrellize o1js proof
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
		const poolKey = PrivateKey.random()
		const poolPublic = poolKey.toPublicKey()
		console.debug("pool public Key", poolPublic.toBase58())

		const deployRight = SignatureRight.canDeployPool()

		const merkle = await getMerkle()

		const signer = await getSigner()
		const signerPk = PrivateKey.fromBase58(signer)
		const signerPublic = signerPk.toPublicKey()

		// insert this new pool in database
		const { error } = await supabase
			.from("Pool")
			.insert({ public_key: poolPublic.toBase58(), token_a: tokenA, token_b: tokenB, user: user })
		if (error) {
			console.error("on insert pool", error)
			throw error
		}

		const listPair = getUniqueUserPairs(users, poolKey.toBase58(), poolPublic.toBase58())
		// insert the encrypted key of the pool in database
		const { error: errorKey } = await supabase.from("PoolKey").insert(listPair)
		if (errorKey) {
			console.error("on insert pool private key", errorKey)
			throw errorKey
		}

		const signature = Signature.create(signerPk, poolKey.toPublicKey().toFields())
		const witness = merkle.getWitness(Poseidon.hash(signerPublic.toFields()))
		const factory = process.env.FACTORY
		const factoryKey = PublicKey.fromBase58(factory)
		const zkFactory = new PoolFactory(factoryKey)

		await fetchAccount({ publicKey: factoryKey })
		const isMinaTokenPool = tokenA === MINA_ADDRESS || tokenB === MINA_ADDRESS
		console.debug({ isMinaTokenPool })
		console.time("prove")
		const transaction = await Mina.transaction(PublicKey.fromBase58(user), async () => {
			fundNewAccount(network, PublicKey.fromBase58(user), 4)
			if (isMinaTokenPool) {
				const token = tokenA === MINA_ADDRESS ? tokenB : tokenA
				await zkFactory.createPool(
					poolPublic,
					PublicKey.fromBase58(token),
					signerPublic,
					signature,
					witness,
					deployRight
				)
			}
			if (!isMinaTokenPool) {
				await zkFactory.createPoolToken(
					poolPublic,
					PublicKey.fromBase58(tokenA),
					PublicKey.fromBase58(tokenB),
					signerPublic,
					signature,
					witness,
					deployRight
				)
			}
		})
		transaction.sign([poolKey])
		await transaction.prove()
		console.timeEnd("prove")
		console.log("job end", id)
		return { pool: poolKey.toPublicKey().toBase58(), transaction: transaction.toJSON() }
	} catch (error) {
		console.error(error)
	}
}

export async function getMerkle(): Promise<MerkleMap> {
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
	users = []
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

	return merkle
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

async function getSigner(): Promise<string> {
	const client = new InfisicalSDK()

	// Authenticate with Infisical
	await client.auth().accessToken(process.env.INFISICAL_TOKEN)

	const singleSecret = await client.secrets().getSecret({
		environment: process.env.INFISICAL_ENVIRONMENT, // stg, dev, prod, or custom environment slugs
		projectId: process.env.INFISICAL_PROJECT_ID,
		secretName: process.env.INFISICAL_SECRET_NAME
	})

	return singleSecret.secretValue
}

const fundNewAccount = async (network: string, feePayer: PublicKey, numberOfAccounts = 1) => {
	try {
		const isZeko = network.includes("zeko")
		const accountUpdate = AccountUpdate.createSigned(feePayer)
		accountUpdate.label = "AccountUpdate.fundNewAccount()"
		const fee = (
			isZeko ? UInt64.from(10 ** 8) : Mina.activeInstance.getNetworkConstants().accountCreationFee
		).mul(numberOfAccounts)
		accountUpdate.balance.subInPlace(fee)
		return accountUpdate
	} catch (error) {
		console.error("fund new account", error)
		return AccountUpdate.fundNewAccount(feePayer, numberOfAccounts)
	}
}
const MINA_ADDRESS = "MINA"
