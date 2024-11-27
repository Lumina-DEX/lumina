import type { NextApiRequest, NextApiResponse } from "next"

const devnet = {
	networkId: "testnet",
	mina: "https://devnet.minaprotocol.network/graphql",
	archive: "https://api.minascan.io/archive/devnet/v1/graphql"
}

const zeko = {
	networkId: "testnet",
	mina: "https://devnet.zeko.io/graphql",
	archive: "https://devnet.zeko.io/graphql"
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
	const json = JSON.stringify(req.body)
	const response = await fetch(devnet.mina, {
		headers: {
			"content-type": "application/json"
		},
		body: json,
		method: "POST"
	})
	const result = await response.json()
	console.log("result", result)
	res.status(200).send(result)
}
