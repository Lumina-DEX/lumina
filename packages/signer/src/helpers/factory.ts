import { allRight, Multisig, MultisigInfo, PoolFactory, SignatureInfo, UpdateSignerData } from "@lumina-dex/contracts"
import { Field, Mina, Poseidon, PrivateKey, PublicKey, Signature, UInt32 } from "o1js"
import { getDb } from "@/db"
import { factory, multisig, poolKey, signerMerkle } from "../../drizzle/schema"
import type { DeployFactoryInputType } from "../graphql"
import { and, eq, sql } from "drizzle-orm"
import { encryptedKeyToField, fundNewAccount, getFee, getMerkle, getNetwork, getUniqueUserPairs } from "./job"
import { Encoding, Encryption } from "o1js"
import { logger } from "./utils"

export const deployFactoryAndTransaction = async ({
	deployer,
	network,
	protocol,
	delegator,
	data,
	jobId
}: DeployFactoryInputType & { jobId: string }) => {
	using db = getDb()
	const Network = getNetwork(network)
	Mina.setActiveInstance(Network)

	logger.log("Deploy factory data", { deployer, network, jobId })

	let factoryPrivateKey: PrivateKey
	let factoryPublicKey: PublicKey
	let factoryPublicKeyBase58: string
	let factoryId: number | undefined

	logger.log("Creating new factory")
	factoryPrivateKey = PrivateKey.random()
	factoryPublicKey = factoryPrivateKey.toPublicKey()
	factoryPublicKeyBase58 = factoryPublicKey.toBase58()

	// Get merkle tree and users
	const [merkle, users] = await getMerkle(db.drizzle, network)
	const root = merkle.getRoot()

	// Fetch signatures from multisig table (get the most recent signatures by deadline)
	const signatures = await db.drizzle
		.select({
			signature: multisig.signature,
			data: multisig.data,
			deadline: multisig.deadline,
			signerPublicKey: signerMerkle.publicKey
		})
		.from(multisig)
		.innerJoin(signerMerkle, eq(multisig.signerId, signerMerkle.id))
		.where(and(eq(multisig.network, network), eq(multisig.data, data)))

	if (signatures.length < 2) {
		throw new Error("At least 2 signatures are required for factory deployment")
	}

	logger.log(`Found ${signatures.length} signatures for factory deployment`)

	const byUser = new Map<string, (typeof signatures)[number]>()
	for (const s of signatures) {
		if (!byUser.has(s.signerPublicKey)) byUser.set(s.signerPublicKey, s)
		if (byUser.size === 2) break
	}
	const twoDistinct = Array.from(byUser.values())
	if (twoDistinct.length < 2) {
		throw new Error("Need signatures from 2 distinct users")
	}

	// Parse UpdateSignerData from the first signature to get messageHash
	const updateSignerJson: { oldRoot: string; newRoot: string; deadlineSlot: number } = JSON.parse(data)
	const updateSigner = new UpdateSignerData({
		oldRoot: Field(updateSignerJson.oldRoot),
		newRoot: Field(updateSignerJson.newRoot),
		deadlineSlot: UInt32.from(updateSignerJson.deadlineSlot)
	})
	const messageHash = updateSigner.hash()
	const deadlineSlot = UInt32.from(updateSignerJson.deadlineSlot)

	// Create MultisigInfo
	const multi = new MultisigInfo({
		approvedUpgrader: root,
		messageHash: messageHash,
		deadlineSlot: deadlineSlot
	})

	// Create SignatureInfo array from database signatures
	const signatureInfoArray: SignatureInfo[] = twoDistinct.map((sig) => {
		const userPublicKey = PublicKey.fromBase58(sig.signerPublicKey)
		const signature = Signature.fromBase58(sig.signature)
		const witness = merkle.getWitness(Poseidon.hash(userPublicKey.toFields()))

		return new SignatureInfo({
			user: userPublicKey,
			witness,
			signature,
			right: allRight
		})
	})

	const minaTransaction = await db.drizzle.transaction(async (txOrm) => {
		logger.log("Starting db transaction for factory deployment")

		// Insert factory
		const result = await txOrm
			.insert(factory)
			.values({
				publicKey: factoryPublicKeyBase58,
				user: deployer,
				network,
				jobId
			})
			.returning({ insertedId: factory.id })

		factoryId = result[0].insertedId
		logger.log("Inserted new factory into database", factoryId)

		// Store encrypted factory private key in poolKey table using double encryption
		// getUniqueUserPairs(users, id, key, isFactory)
		const listPair = getUniqueUserPairs(users, factoryId!, factoryPrivateKey.toBase58(), true)
		await txOrm.insert(poolKey).values(listPair)
		logger.log("Stored encrypted factory private key")

		const zkFactory = new PoolFactory(factoryPublicKey)

		logger.log("Creating Mina transaction for factory deployment")
		console.time("prove factory deployment")

		const minaTx = await Mina.transaction(
			{
				sender: PublicKey.fromBase58(deployer),
				fee: getFee(network)
			},
			async () => {
				logger.log("Funding new account for factory ...")
				fundNewAccount(network, PublicKey.fromBase58(deployer), 4)

				logger.log("Deploying factory ...")
				await zkFactory.deploy({
					symbol: "FAC",
					src: "https://luminadex.com/",
					protocol: PublicKey.fromBase58(protocol), // TODO: Set proper protocol address from config
					delegator: PublicKey.fromBase58(delegator), // TODO: Set proper delegator address from config
					approvedSigner: root,
					multisig: new Multisig({ info: multi, signatures: signatureInfoArray })
				})
				logger.log("Factory deployed successfully")
			}
		)

		logger.log("Signing factory deployment transaction ...")
		minaTx.sign([factoryPrivateKey])

		logger.log("Proving factory deployment transaction ...")
		await minaTx.prove()

		logger.log("Done, returning factory deployment transaction ...")
		console.timeEnd("prove factory deployment")

		return minaTx.toJSON()
	})

	return { factoryPublicKey: factoryPublicKeyBase58, transactionJson: minaTransaction }
}
