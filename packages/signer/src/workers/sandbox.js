import { PoolFactory, SignatureRight } from "@lumina-dex/contracts"
import { MINA_ADDRESS } from "@lumina-dex/sdk"

import { fetchAccount, Mina, Poseidon, PrivateKey, PublicKey, Signature } from "o1js"
import { pool, poolKey as tPoolKey } from "../../drizzle/schema"
import {
	compileContracts,
	database,
	fundNewAccount,
	getEnv,
	getFee,
	getMasterSigner,
	getMerkle,
	getNetwork,
	getUniqueUserPairs
} from "../helpers"

let compiled = false

/**
 * Sandbox worker to parallelize o1js proof
 * @param {import('bullmq').Job<{tokenA: string, tokenB: string, user: string, network: import('@lumina-dex/sdk').Networks}>} job
 * @returns {Promise<{ transaction: string, pool: string}>}
 */
export default async function (job) {
	try {
		await job.log("Start processing job")
		if (!compiled) await compileContracts()
		console.log("Contracts compiled")
		compiled = true

		const id = job.id
		console.log("job id", id)

		const { tokenA, tokenB, user, network } = job.data

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
			// insert this new pool in database
			const result = await txOrm
				.insert(pool)
				.values({
					publicKey: newPoolPublicKey.toBase58(),
					tokenA,
					tokenB,
					user,
					network
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
