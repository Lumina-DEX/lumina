import type { NextApiRequest, NextApiResponse } from "next"
import { AccountUpdate, Mina, PrivateKey, PublicKey } from "o1js"
import { FungibleToken, MinaTokenHolder, PoolMina } from "../../../../contracts/build/src/indexmina"

type ResponseData = {
	message: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
	if (req.method === "POST") {
		const json = req.body
		const tokenXAddress = json.tokenX as string

		if (tokenXAddress) {
			await PoolMina.compile()
			await MinaTokenHolder.compile()
			await FungibleToken.compile()

			const Network = Mina.Network({
				networkId: "testnet",
				mina: "https://api.minascan.io/node/devnet/v1/graphql"
			})
			Mina.setActiveInstance(Network)

			const poolKey = PrivateKey.random()
			const pool = new PoolMina(poolKey.toPublicKey())
			console.log("appkey", poolKey.toBase58())
			const tokenKey = PublicKey.fromBase58(tokenXAddress)
			const tokenX = new FungibleToken(tokenKey)
			const holderX = new MinaTokenHolder(poolKey.toPublicKey(), tokenX.deriveTokenId())

			const senderKey = PrivateKey.fromBase58(process.env.FEE_PAYER!)
			const fee = 0.1 * 1e9
			const transaction = await Mina.transaction({ sender: senderKey.toPublicKey() }, async () => {
				AccountUpdate.fundNewAccount(senderKey.toPublicKey(), 3)
				await pool.deploy()
				await holderX.deploy()
				await tokenX.approveAccountUpdate(holderX.self)
			})
			await transaction.prove()
			const sentTx = await transaction.sign([senderKey, poolKey]).send()

			const key = poolKey.toBase58()

			return { key, hash: sentTx.hash }
		}
		return res.status(500).json({ message: "token address empty" })
	} else {
		return res.status(404)
	}
}
