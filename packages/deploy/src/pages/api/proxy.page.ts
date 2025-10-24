import type { NextApiRequest, NextApiResponse } from "next"

const API_URL = "https://devnet.minaprotocol.network/graphql" // The actual URL of your API

export default async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
	const json = JSON.stringify(req.body)
	const response = await fetch(API_URL, {
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
