import { Job } from "bullmq"
import {
	Account,
	AccountUpdate,
	Bool,
	Cache,
	Encoding,
	Encryption,
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
import { Database } from "../supabase"
import { Cipher } from "crypto"
import { getUniqueUserPairs } from "@/utils/utils"

dotenv.config()

const supabase = createClient<Database>(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

const networId = process.env.NETWORK_ID as NetworkId
const networkUrl = process.env.NETWORK_URL

// list of different approved user to sign
let users = []

setNumberOfWorkers(4)

const Network = Mina.Network({
	networkId: networId,
	mina: networkUrl
})
Mina.setActiveInstance(Network)

console.time("compile")
//const cacheFiles = await fetchFromServerFiles();
const cache = Cache.FileSystem("./cache")
console.log("compile pool factory")
await PoolFactory.compile({ cache })
console.log("compile pool fungible token")
await FungibleToken.compile({ cache })
console.timeEnd("compile")

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

		const { tokenA, tokenB, user, onlyCompile } = job.data

		if (onlyCompile) {
			return "Compiled"
		}

		console.log("data", { tokenA, tokenB, user })
		const poolKey = PrivateKey.random()
		const poolPublic = poolKey.toPublicKey()
		console.debug("pool public Key", poolPublic.toBase58())

		const deployRight = SignatureRight.canDeployPool()

		const merkle = await getMerkle()
		// TODO: temporary solution for testnet
		const signer = process.env.SIGNER_PRIVATE_KEY
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
			fundNewAccount(PublicKey.fromBase58(user), 4)
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

const fundNewAccount = async (feePayer: PublicKey, numberOfAccounts = 1) => {
	try {
		const isZeko = networkUrl.includes("zeko")
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
