import express, { Express, Request, Response, Application } from "express"
import dotenv from "dotenv"
import {
	AccountUpdate,
	Bool,
	fetchAccount,
	MerkleTree,
	Mina,
	NetworkId,
	Poseidon,
	PrivateKey,
	PublicKey,
	Signature,
	Transaction,
	UInt64,
	UInt8
} from "o1js"

import { PoolFactory, SignerMerkleWitness } from "@lumina-dex/contracts"

//For env File
dotenv.config()

const app: Application = express()
const port = process.env.PORT || 8000

app.use(express.json())

app.get("/", (req: Request, res: Response) => {
	res.send("Welcome to Express & TypeScript Server")
})

app.post("/api/sign", async (req: Request, res: Response) => {
	try {
		console.log("body", req.body)
		const tokenA = req.body.tokenA
		const tokenB = req.body.tokenB
		const userAddress = req.body.user
		const MINA_ADDRESS = "MINA"
		const isMinaTokenPool = tokenA === MINA_ADDRESS || tokenB === MINA_ADDRESS
		console.log("tokenA", tokenA)
		console.log("tokenB", tokenB)
		console.log("userAddress", userAddress)

		const user = PublicKey.fromBase58(userAddress)

		const factoryKey = PublicKey.fromBase58(
			"B62qo8GFnNj3JeYq6iUUXeHq5bqJqPQmT5C2cTU7YoVc4mgiC8XEjHd"
		)
		const signerKey = PrivateKey.fromBase58("EKE9dyeMmvz6deCC2jD9rBk7d8bG6ZDqVno8wRe8tAbQDussfBYi")
		const factory = new PoolFactory(factoryKey)
		const poolPrivate = PrivateKey.random()
		const poolPublic = poolPrivate.toPublicKey()
		const user0 = PublicKey.fromBase58("B62qrUAGW6S4pSBcZko2LdbUAhtLd15zVs9KtQedScBvwuZVbcnej35")
		const merkle = new MerkleTree(32)
		const user1 = signerKey.toPublicKey()
		merkle.setLeaf(0n, Poseidon.hash(user0.toFields()))
		merkle.setLeaf(1n, Poseidon.hash(user1.toFields()))
		const signature = Signature.create(signerKey, poolPublic.toFields())
		const witness = merkle.getWitness(1n)
		const circuitWitness = new SignerMerkleWitness(witness)

		console.log("create tx")

		const network = Mina.Network({
			networkId: "testnet",
			mina: "https://api.minascan.io/node/devnet/v1/graphql",
			archive: "https://api.minascan.io/archive/devnet/v1/graphql"
		})

		Mina.setActiveInstance(network)

		const transaction = await Mina.transaction(user, async () => {
			AccountUpdate.fundNewAccount(user, 4)
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

		const jsonResult = transaction.toJSON()
		res.send({ transaction: jsonResult })
	} catch (error) {
		console.error(error)
		res.sendStatus(500)
	}
})

app.listen(port, () => {
	console.log(`Server is Fire at https://localhost:${port}`)
})
