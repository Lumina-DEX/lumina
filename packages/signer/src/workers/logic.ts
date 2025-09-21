import { getDb } from "@/db"
import { deployPoolRight, PoolFactory } from "@lumina-dex/contracts"
import { luminadexFactories, MINA_ADDRESS } from "@lumina-dex/sdk"
import { fetchAccount, Mina, Poseidon, PrivateKey, Provable, PublicKey, Signature, TokenId, UInt64 } from "o1js"
import { pool, poolKey as tPoolKey } from "../../drizzle/schema"
import type { CreatePoolInputType } from "../graphql"
import {
	createPoolKeys,
	fundNewAccount,
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
	using db = getDb()
	const Network = getNetwork(network)
	Mina.setActiveInstance(Network)

	console.log("data", { tokenA, tokenB, user, network })
	const { newPoolPrivateKey, newPoolPublicKey, newPoolPublicKeyBase58 } = await createPoolKeys(db.drizzle)

	const [merkle, users] = await getMerkle(db.drizzle, network)

	const masterSigner = await getMasterSigner()
	const masterSignerPrivateKey = PrivateKey.fromBase58(masterSigner)
	const masterSignerPublicKey = masterSignerPrivateKey.toPublicKey()

	const minaTransaction = await db.drizzle.transaction(async (txOrm) => {
		console.log("Starting db transaction")

		// insert this new pool in database
		const result = await txOrm
			.insert(pool)
			.values({
				publicKey: newPoolPublicKeyBase58,
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
		// console.log("Inserted pool keys into database", listPair)
		const signature = Signature.create(masterSignerPrivateKey, newPoolPublicKey.toFields())
		const witness = merkle.getWitness(Poseidon.hash(masterSignerPublicKey.toFields()))
		const factory = luminadexFactories[network]
		const factoryKey = PublicKey.fromBase58(factory)
		const zkFactory = new PoolFactory(factoryKey)
		const factoryTokenId = TokenId.derive(factoryKey)

		const tokenAPublicKey = tokenA === MINA_ADDRESS ? PublicKey.empty() : PublicKey.fromBase58(tokenA)
		const tokenBPublicKey = tokenB === MINA_ADDRESS ? PublicKey.empty() : PublicKey.fromBase58(tokenB)

		// For pool creation, we need to ensure that tokenA and tokenB are ordered
		const tokenALower = tokenAPublicKey.x.lessThan(tokenBPublicKey.x)
		const token0 = Provable.if(tokenAPublicKey.isEmpty().or(tokenALower), tokenAPublicKey, tokenBPublicKey)
		const token1 = Provable.if(token0.equals(tokenBPublicKey), tokenAPublicKey, tokenBPublicKey)

		await fetchAccount({ publicKey: user })
		await fetchAccount({ publicKey: factoryKey })

		const isMinaTokenPool = token0.isEmpty().toBoolean()
		if (isMinaTokenPool) {
			const tokenAccount = await fetchAccount({
				publicKey: token1,
				tokenId: factoryTokenId
			})
			const balancePool = tokenAccount?.account?.balance || UInt64.from(0n)
			if (balancePool.toBigInt() > 0n) {
				throw new Error(`Token ${token1.toBase58()} had already a pool`)
			}
		} else {
			const fields = token0.toFields().concat(token1.toFields())
			const hash = Poseidon.hashToGroup(fields)
			const pairPublickey = PublicKey.fromGroup(hash)
			const tokenAccount = await fetchAccount({
				publicKey: pairPublickey,
				tokenId: factoryTokenId
			})
			const balancePool = tokenAccount?.account?.balance || UInt64.from(0n)
			if (balancePool.toBigInt() > 0n) {
				throw new Error(`Token ${token0.toBase58()} and ${token1.toBase58()} had already a pool`)
			}
		}
		console.debug({ isMinaTokenPool })
		console.time("prove")
		const minaTx = await Mina.transaction(
			{
				sender: PublicKey.fromBase58(user),
				fee: getFee(network)
			},
			async () => {
				console.log("Funding new account ...")
				if (isMinaTokenPool) {
					fundNewAccount(network, PublicKey.fromBase58(user), 4)
					const token = tokenA === MINA_ADDRESS ? tokenB : tokenA
					console.log("Creating Mina token pool ...", token)
					await zkFactory.createPool(
						newPoolPublicKey,
						token1,
						masterSignerPublicKey,
						signature,
						witness,
						deployPoolRight
					)
					console.log("Mina token pool created successfully")
				}
				if (!isMinaTokenPool) {
					fundNewAccount(network, PublicKey.fromBase58(user), 5)
					console.log("Creating non-Mina token pool ...")
					await zkFactory.createPoolToken(
						newPoolPublicKey,
						token0,
						token1,
						masterSignerPublicKey,
						signature,
						witness,
						deployPoolRight
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
	return { poolPublicKey: newPoolPublicKeyBase58, transactionJson: minaTransaction }
}
