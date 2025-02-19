import { type } from "arktype"

import { AccountUpdate, MerkleTree, Mina, Poseidon, PrivateKey, PublicKey, Signature } from "o1js"

import {
	FungibleToken,
	FungibleTokenAdmin,
	PoolFactory,
	SignerMerkleWitness
} from "@lumina-dex/contracts"

import {
	type Networks,
	networks,
	fetchZippedContracts,
	readCache,
	minaNetwork
} from "@lumina-dex/sdk"

import { MINA_ADDRESS, luminadexFactories } from "@lumina-dex/sdk/constants"

const requestBody = type({
	tokenA: "string",
	tokenB: "string",
	user: "string"
})

const SIGNER_PRIVATE_KEY =
	Bun.env.SIGNER_PRIVATE_KEY ?? "EKE9dyeMmvz6deCC2jD9rBk7d8bG6ZDqVno8wRe8tAbQDussfBYi"
const USER_O_PUBLIC_KEY =
	Bun.env.USER_O_PUBLIC_KEY ?? "B62qrUAGW6S4pSBcZko2LdbUAhtLd15zVs9KtQedScBvwuZVbcnej35"

const createMeasure = (label: string) => {
	const start = performance.now()
	let done = false
	return () => {
		if (done) return
		const end = performance.now()
		console.log(`${label}: ${end - start} ms`)
		done = true
	}
}

Bun.serve({
	async fetch(request) {
		try {
			const mRequest = createMeasure("Request")
			const mSetup = createMeasure("Setup")
			// Extract pathname from URL
			const url = new URL(request.url)
			const network = url.pathname.slice(1) as Networks // Remove leading slash
			if (networks.includes(network) === false)
				return new Response("Invalid Network", { status: 400 })

			const body = await request.json()
			const validatedBody = requestBody(body)
			if (validatedBody instanceof type.errors)
				return new Response("Invalid request body", { status: 400 })

			const { tokenA, tokenB, user } = validatedBody
			const isMinaTokenPool = tokenA === MINA_ADDRESS || tokenB === MINA_ADDRESS

			const userPublicKey = PublicKey.fromBase58(user)
			const factoryPublicKey = PublicKey.fromBase58(luminadexFactories[network])
			const signerPrivateKey = PrivateKey.fromBase58(SIGNER_PRIVATE_KEY)

			const factory = new PoolFactory(factoryPublicKey)
			const poolPrivate = PrivateKey.random()
			const poolPublic = poolPrivate.toPublicKey()
			const user0 = PublicKey.fromBase58(USER_O_PUBLIC_KEY)

			const merkle = new MerkleTree(32)
			const user1 = signerPrivateKey.toPublicKey()
			merkle.setLeaf(0n, Poseidon.hash(user0.toFields()))
			merkle.setLeaf(1n, Poseidon.hash(user1.toFields()))
			const signature = Signature.create(signerPrivateKey, poolPublic.toFields())
			const witness = merkle.getWitness(1n)
			//TODO: investigate typescript error
			// @ts-expect-error - typescript error ?
			const circuitWitness = new SignerMerkleWitness(witness)
			Mina.setActiveInstance(minaNetwork(network))
			mSetup()

			const mZip = createMeasure("zip")
			const cachedContracts = await fetchZippedContracts()
			const cache = readCache(cachedContracts)
			mZip()

			const mCompile = createMeasure("compile")
			await FungibleTokenAdmin.compile({ cache })
			await FungibleToken.compile({ cache })
			await PoolFactory.compile({ cache })
			mCompile()

			const mTransaction = createMeasure("Sign and Prove transaction")
			const transaction = await Mina.transaction(userPublicKey, async () => {
				AccountUpdate.fundNewAccount(userPublicKey, 4)
				if (isMinaTokenPool) {
					const token = tokenA === MINA_ADDRESS ? tokenB : tokenA
					await factory.createPool(
						poolPublic,
						PublicKey.fromBase58(token),
						user1,
						signature,
						circuitWitness
					)
				} else {
					await factory.createPoolToken(
						poolPublic,
						PublicKey.fromBase58(tokenA),
						PublicKey.fromBase58(tokenB),
						user1,
						signature,
						circuitWitness
					)
				}
			})
			transaction.sign([poolPrivate])
			await transaction.prove()
			mTransaction()

			const jsonResult = transaction.toJSON()
			const parsed = JSON.parse(jsonResult)
			// const newTx = Transaction.fromJSON(parsed)
			mRequest()
			return Response.json(parsed)
		} catch (error) {
			console.error("Error processing request:", error)
			return new Response("Internal Server Error", { status: 500 })
		}
	}
})
