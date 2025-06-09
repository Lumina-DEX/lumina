import {
	Account,
	AccountUpdate,
	Bool,
	Cache,
	MerkleMap,
	Mina,
	NetworkId,
	Poseidon,
	PrivateKey,
	PublicKey,
	Signature,
	UInt32,
	UInt64,
	fetchAccount,
	setNumberOfWorkers
} from "o1js"
import { FungibleToken, PoolFactory, SignatureRight } from "@lumina-dex/contracts"
import IORedis from "ioredis"
import { Worker } from "bullmq"
import dotenv from "dotenv"

dotenv.config()

const connection = new IORedis({ maxRetriesPerRequest: null })

const networId = process.env.NETWORK_ID as NetworkId
const networkUrl = process.env.NETWORK_URL

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

const worker = new Worker(
	"createPool",
	async (job: any) => {
		const id = job.id
		console.log("job id", id)
		setNumberOfWorkers(4)

		const { tokenA, tokenB, user } = job.data

		console.log("data", { tokenA, tokenB, user })
		const poolKey = PrivateKey.random()
		console.debug({ poolKey })

		const allRight = new SignatureRight(
			Bool(true),
			Bool(true),
			Bool(true),
			Bool(true),
			Bool(true),
			Bool(true)
		)
		const deployRight = SignatureRight.canDeployPool()

		const merkle = getMerkle()
		// TODO: temporary solution for testnet
		const signer = process.env.SIGNER_PRIVATE_KEY
		const signerPk = PrivateKey.fromBase58(signer)
		const signerPublic = signerPk.toPublicKey()

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
					poolKey.toPublicKey(),
					PublicKey.fromBase58(token),
					signerPublic,
					signature,
					witness,
					deployRight
				)
			}
			if (!isMinaTokenPool) {
				await zkFactory.createPoolToken(
					poolKey.toPublicKey(),
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
	},
	{ connection, concurrency: 5 }
)

worker.on("completed", (job) => {
	console.log(`${job.id} has completed!`)
})

worker.on("failed", (job, err) => {
	console.log(`${job.id} has failed with ${err.message}`)
})

export function getMerkle(): MerkleMap {
	const ownerPublic = PublicKey.fromBase58(
		"B62qjabhmpW9yfLbvUz87BR1u462RRqFfXgoapz8X3Fw8uaXJqGG8WH"
	)
	const approvedSignerPublic = PublicKey.fromBase58(
		"B62qpko6oWqKU4LwAaT7PSX3b6TYvroj6umbpyEXL5EEeBbiJTUMU5Z"
	)
	const signer1Public = PublicKey.fromBase58(
		"B62qrgWEGhgXQ5PnpEaeJqs1MRx4Jiw2aqSTfyxAsEVDJzqNFm9PEQt"
	)
	const signer2Public = PublicKey.fromBase58(
		"B62qkfpRcsJjByghq8FNkzBh3wmzLYFWJP2qP9x8gJ48ekfd6MVXngy"
	)
	const signer3Public = PublicKey.fromBase58(
		"B62qic5sGvm6QvFzJ92588YgkKxzqi2kFeYydnkM8VDAvY9arDgY6m6"
	)
	const externalSigner1 = PublicKey.fromBase58(
		"B62qkjzL662Z5QD16cB9j6Q5TH74y42ALsMhAiyrwWvWwWV1ypfcV65"
	)
	const externalSigner2 = PublicKey.fromBase58(
		"B62qpLxXFg4rmhce762uiJjNRnp5Bzc9PnCEAcraeaMkVWkPi7kgsWV"
	)
	const externalSigner3 = PublicKey.fromBase58(
		"B62qipa4xp6pQKqAm5qoviGoHyKaurHvLZiWf3djDNgrzdERm6AowSQ"
	)

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
	merkle.set(Poseidon.hash(ownerPublic.toFields()), allRight.hash())
	merkle.set(Poseidon.hash(signer1Public.toFields()), allRight.hash())
	merkle.set(Poseidon.hash(signer2Public.toFields()), allRight.hash())
	merkle.set(Poseidon.hash(signer3Public.toFields()), allRight.hash())
	merkle.set(Poseidon.hash(approvedSignerPublic.toFields()), deployRight.hash())
	merkle.set(Poseidon.hash(externalSigner1.toFields()), allRight.hash())
	merkle.set(Poseidon.hash(externalSigner2.toFields()), allRight.hash())
	merkle.set(Poseidon.hash(externalSigner3.toFields()), allRight.hash())

	return merkle
}
