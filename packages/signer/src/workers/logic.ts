import { PoolFactory, SignatureRight } from "@lumina-dex/contracts"
import { MINA_ADDRESS } from "@lumina-dex/sdk"

import { fetchAccount, Mina, Poseidon, PrivateKey, PublicKey, Signature } from "o1js"
import { pool, poolKey as tPoolKey } from "../../drizzle/schema"
import type { CreatePoolInputType } from "../graphql"
import {
	database,
	fundNewAccount,
	getEnv,
	getFee,
	getMasterSigner,
	getMerkle,
	getNetwork,
	getUniqueUserPairs
} from "../helpers"

export const createPoolAndTransaction = async ({
	tokenA,
	tokenB,
	user,
	network,
	jobId
}: CreatePoolInputType & { jobId: string }) => {
	const db = database()
	const env = getEnv()
	const Network = getNetwork(network)
	Mina.setActiveInstance(Network)

	console.log("data", { tokenA, tokenB, user, network })
	const newPoolPrivateKey = PrivateKey.random()
	const newPoolPublicKey = newPoolPrivateKey.toPublicKey()
	console.debug("pool public Key", newPoolPublicKey.toBase58())

	const deployRight = SignatureRight.canDeployPool()

	const [merkle, users] = await getMerkle()

	const masterSigner = await getMasterSigner()
	const masterSignerPrivateKey = PrivateKey.fromBase58(masterSigner)
	const masterSignerPublicKey = masterSignerPrivateKey.toPublicKey()

	const minaTransaction = await db.transaction(async (txOrm) => {
		console.log("Starting db transaction")
		// insert this new pool in database
		const result = await txOrm
			.insert(pool)
			.values({
				publicKey: newPoolPublicKey.toBase58(),
				tokenA,
				tokenB,
				user,
				network,
				jobId,
				status: "pending"
			})
			.returning({ insertedId: pool.id })
		console.log("Inserted new pool into database", result)
		const poolId = result[0].insertedId
		const listPair = getUniqueUserPairs(users, poolId, newPoolPrivateKey.toBase58())
		// insert the encrypted key of the pool in database
		await txOrm.insert(tPoolKey).values(listPair)
		console.log("Inserted pool keys into database", listPair)
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
				console.log("Funding new account ...")
				fundNewAccount(network, PublicKey.fromBase58(user), 4)
				if (isMinaTokenPool) {
					const token = tokenA === MINA_ADDRESS ? tokenB : tokenA
					console.log("Creating Mina token pool ...", token)
					await zkFactory.createPool(
						newPoolPublicKey,
						PublicKey.fromBase58(token),
						masterSignerPublicKey,
						signature,
						witness,
						deployRight
					)
					console.log("Mina token pool created successfully")
				}
				if (!isMinaTokenPool) {
					console.log("Creating non-Mina token pool ...")
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
		console.log("Signing ... ")
		minaTx.sign([newPoolPrivateKey])
		console.log("Proving ...")
		await minaTx.prove()
		console.timeEnd("prove")
		return minaTx.toJSON()
	})
	return {
		poolPublicKey: newPoolPublicKey.toBase58(),
		transactionJson: minaTransaction
	}
}
